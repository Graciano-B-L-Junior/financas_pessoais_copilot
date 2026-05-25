#!/bin/bash
set -e

MODEL="${OLLAMA_MODEL:-llama3.2:3b}"

# Inicia o servidor ollama em background
ollama serve &
SERVE_PID=$!

# Aguarda o servidor estar pronto
echo "[ollama-init] Aguardando servidor..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done

# Faz pull do modelo somente se ainda não estiver no volume
if ollama list 2>/dev/null | grep -q "^${MODEL}"; then
  echo "[ollama-init] Modelo ${MODEL} já instalado."
else
  echo "[ollama-init] Instalando modelo ${MODEL}..."
  ollama pull "${MODEL}"
  echo "[ollama-init] Modelo ${MODEL} instalado com sucesso."
fi

# Mantém o servidor em foreground
wait $SERVE_PID
