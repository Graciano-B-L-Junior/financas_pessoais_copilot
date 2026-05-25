import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatMessage
from .serializers import ChatHistorySerializer, ChatMessageSerializer
from .services import (
    build_financial_context,
    build_prompt,
    call_ollama,
    check_rate_limit,
    get_or_create_active_session,
)

logger = logging.getLogger(__name__)

_MSG_UNAVAILABLE = "O assistente está temporariamente indisponível. Tente novamente em instantes."
_MAX_HISTORY_TURNS = 10


class ChatMessageView(APIView):
    """
    POST /api/v1/chat/message/
    Envia uma mensagem ao assistente e retorna a resposta do LLM.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message_text = (request.data.get("message") or "").strip()

        # SEC-005: validação de tamanho antes de qualquer chamada ao LLM
        if len(message_text) < 2 or len(message_text) > 500:
            return Response(
                {
                    "status": 400,
                    "status_text": "Bad Request",
                    "message": "A mensagem deve ter entre 2 e 500 caracteres.",
                },
                status=400,
            )

        # SEC-004: rate limiting via cache Redis
        if not check_rate_limit(request.user.id):
            return Response(
                {
                    "status": 429,
                    "status_text": "Too Many Requests",
                    "message": "Limite de mensagens atingido. Tente novamente em instantes.",
                },
                status=429,
            )

        # C005: recupera ou cria sessão ativa
        session = get_or_create_active_session(request.user)

        # C006: últimos N pares como histórico
        recent_messages = list(
            session.messages.order_by("-created_at")[: _MAX_HISTORY_TURNS * 2]
        )
        recent_messages.reverse()
        history = [{"role": m.role, "content": m.content} for m in recent_messages]

        # C003, SEC-003: contexto financeiro somente do usuário autenticado
        context = build_financial_context(request.user)

        # SEC-001: prompt estruturado com delimitadores
        prompt = build_prompt(context, message_text, history)

        # Persiste mensagem do usuário
        user_msg = ChatMessage.objects.create(
            session=session,
            role=ChatMessage.ROLE_USER,
            content=message_text,
        )

        # Chama o LLM
        llm_response = call_ollama(prompt)

        if llm_response is None:
            # Deleta a mensagem do usuário para não poluir o histórico
            user_msg.delete()
            return Response(
                {
                    "status": 503,
                    "status_text": "Service Unavailable",
                    "message": _MSG_UNAVAILABLE,
                },
                status=503,
            )

        # SEC-002, C008: armazena como texto plano
        assistant_msg = ChatMessage.objects.create(
            session=session,
            role=ChatMessage.ROLE_ASSISTANT,
            content=llm_response,
            context_snapshot=context,  # SEC-006: auditoria
        )

        # Atualiza updated_at da sessão
        session.save(update_fields=["updated_at"])

        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "data": {
                    "session_id": str(session.id),
                    **ChatMessageSerializer(assistant_msg).data,
                },
            },
            status=200,
        )


class ChatHistoryView(APIView):
    """
    GET  /api/v1/chat/history/  — histórico da sessão ativa
    DELETE /api/v1/chat/history/  — limpa histórico (deleta sessão)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = get_or_create_active_session(request.user)
        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "data": ChatHistorySerializer(session).data,
            }
        )

    def delete(self, request):
        # RF004: limpa histórico deletando a sessão ativa (nova sessão será criada no próximo GET/POST)
        session = (
            request.user.chat_sessions.order_by("-updated_at").first()
        )
        if session:
            session.delete()
        return Response(status=204)
