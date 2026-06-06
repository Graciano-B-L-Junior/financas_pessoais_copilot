"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportTaskStatus, ImportTaskState } from "@/types";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutos
const MAX_CONSECUTIVE_FAILURES = 3;
const TASK_STORAGE_KEY = "spreadsheet_import_task";
const TASK_EXPIRY_MS = 6 * 60 * 60 * 1_000; // 6 horas

const TERMINAL_STATES: ImportTaskState[] = ["SUCCESS", "FAILURE", "UNKNOWN"];

interface StoredTask {
  taskId: string;
  queued: number;
  timestamp: number;
}

interface ImportProgressBarProps {
  taskId: string;
  queued: number;
  onRetry: () => void;
}

export function ImportProgressBar({ taskId, queued, onRetry }: ImportProgressBarProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ImportTaskStatus>({
    state: "PENDING",
    percent: 0,
    created: 0,
    skipped: 0,
    total: queued,
    error: null,
  });
  const [timedOut, setTimedOut] = useState(false);
  const consecutiveFailures = useRef(0);
  const startedAt = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Salvar task em localStorage ao montar
  useEffect(() => {
    try {
      const stored: StoredTask = {
        taskId,
        queued,
        timestamp: Date.now(),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(stored));
      }
    } catch (e) {
      console.warn("Falha ao salvar task em localStorage:", e);
    }
  }, [taskId, queued]);

  // Limpar localStorage após conclusão ou expiração
  function clearStoredTask() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TASK_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Falha ao limpar localStorage:", e);
    }
  }

  useEffect(() => {
    async function poll() {
      // Verificar timeout global
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setTimedOut(true);
        return;
      }

      try {
        const res = await fetch(`/api/import/status/${taskId}`, { cache: "no-store" });

        if (!res.ok) {
          consecutiveFailures.current += 1;
          if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
            stopPolling();
            setTimedOut(true);
          }
          return;
        }

        consecutiveFailures.current = 0;
        const data: ImportTaskStatus = await res.json();
        setStatus(data);

        if (TERMINAL_STATES.includes(data.state)) {
          stopPolling();
          clearStoredTask();

          if (data.state === "SUCCESS") {
            // Pequeno delay para o usuário ver 100% antes do redirect
            setTimeout(() => {
              router.push("/lancamentos");
            }, 1500);
          }

          // Se task expirou no backend, limpar e mostrar erro
          if (data.state === "UNKNOWN") {
            console.warn("Task expirou no backend ou não foi encontrada");
          }
        }
      } catch {
        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
          stopPolling();
          setTimedOut(true);
          clearStoredTask();
        }
      }
    }

    // Primeira checagem imediata
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [taskId, router]);

  // Limpar localStorage se timeout global
  useEffect(() => {
    if (timedOut) {
      clearStoredTask();
    }
  }, [timedOut]);

  const isFinished = TERMINAL_STATES.includes(status.state) || timedOut;
  const isFailed = status.state === "FAILURE";
  const isSuccess = status.state === "SUCCESS";

  return (
    <div className="progress-container" role="status" aria-live="polite">
      <div className="progress-header">
        <span className="progress-title">
          {isSuccess && "Importação concluída!"}
          {isFailed && "Falha na importação"}
          {timedOut && !isFailed && "Tempo esgotado"}
          {!isFinished && stateLabel(status.state)}
        </span>

        {!isFinished && (
          <span className="progress-percent">{status.percent}%</span>
        )}
      </div>

      {/* Barra de progresso */}
      {!isFailed && !timedOut && (
        <div className="progress-track" aria-hidden="true">
          <div
            className={`progress-fill ${isSuccess ? "progress-fill--success" : ""}`}
            style={{ width: `${isSuccess ? 100 : status.percent}%` }}
          />
        </div>
      )}

      {/* Contadores */}
      {(status.state === "PROGRESS" || status.state === "SUCCESS") && (
        <div className="progress-stats">
          <span>
            <strong>{status.created}</strong> criado(s)
          </span>
          <span>
            <strong>{status.skipped}</strong> ignorado(s)
          </span>
          {status.total > 0 && (
            <span>
              de <strong>{status.total}</strong> total
            </span>
          )}
        </div>
      )}

      {/* Mensagem de sucesso */}
      {isSuccess && (
        <p className="progress-message progress-message--success">
          {status.created} lançamento(s) criado(s), {status.skipped} ignorado(s).
          Redirecionando para lançamentos...
        </p>
      )}

      {/* Mensagem de erro */}
      {isFailed && (
        <div className="progress-message progress-message--error">
          <p style={{ margin: "0 0 1rem 0" }}>
            {status.error || "Ocorreu um erro durante a importação."}
          </p>
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Timeout */}
      {timedOut && !isFailed && (
        <div className="progress-message progress-message--warning">
          <p style={{ margin: "0 0 1rem 0" }}>
            O processamento está demorando mais que o esperado. Os lançamentos podem ter sido
            criados em segundo plano.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/lancamentos" className="btn btn--primary">
              Ver lançamentos
            </a>
            <button type="button" className="btn btn--secondary" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Retry state */}
      {status.state === "RETRY" && (
        <p className="progress-message" style={{ color: "var(--muted)" }}>
          Aguardando nova tentativa automática...
        </p>
      )}
    </div>
  );
}

function stateLabel(state: ImportTaskState): string {
  switch (state) {
    case "PENDING":
      return "Aguardando na fila...";
    case "STARTED":
      return "Iniciando importação...";
    case "PROGRESS":
      return "Importando lançamentos...";
    case "RETRY":
      return "Reprocessando...";
    default:
      return "Processando...";
  }
}
