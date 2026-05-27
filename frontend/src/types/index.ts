// ─── Usuário ──────────────────────────────────────────────
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

// ─── Categoria ────────────────────────────────────────────
export type CategoryType = "receita" | "despesa";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  description: string;
  is_active: boolean;
}

export interface CategoryOption extends Category {
  label: string;
}

// ─── Lançamento ───────────────────────────────────────────
export type TransactionType = "receita" | "despesa";
export type TransactionFrequency =
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "anual";

export interface Transaction {
  id: number;
  amount: string;
  category: number;
  category_name?: string;
  date: string;
  description: string;
  end_date?: string | null;
  frequency?: TransactionFrequency | null;
  is_recurring: boolean;
  start_date?: string | null;
  type: TransactionType;
}

// ─── Orçamento ────────────────────────────────────────────
export type BudgetStatus = "active" | "inactive" | "archived";

export interface BudgetCategory {
  category_id: number;
  category_name?: string;
  budgeted_amount: number;
  actual_amount?: number;
}

export interface BudgetExecution {
  budgeted_total: number;
  actual_expenses: number;
  remaining_amount: number;
  execution_percentage: number;
  categories?: BudgetExecutionCategory[];
  alerts?: BudgetAlert[];
}

export interface BudgetExecutionCategory {
  category: string;
  budgeted: number;
  actual: number;
  percentage: number;
}

export interface BudgetAlert {
  type: "exceeded" | "warning" | "ok";
  message: string;
}

export interface Budget {
  id: number;
  month: string;
  total_amount: number;
  status: BudgetStatus;
  categories: BudgetCategory[];
  execution?: BudgetExecution;
}

// ─── Dashboard ────────────────────────────────────────────
export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
  recurring_count: number;
}

export interface BudgetSummary {
  execution_percentage: number;
}

export interface MonthlySeries {
  month: string;
  income: number;
  expenses: number;
}

export interface TopCategory {
  category: string;
  total: number;
  type: TransactionType;
}

export interface BudgetSeries {
  category: string;
  budgeted: number;
  actual: number;
}

export type CategorySeriesGranularity = "monthly" | "daily";

export interface CategoryEvolutionPoint {
  label: string;
  total: number | null;
}

export interface CategoryEvolutionBudget {
  month: string;
  category_id: number;
  category_name: string;
  budgeted_amount: number;
}

// ─── AI Chat ──────────────────────────────────────────────────
export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ChatHistory {
  session_id: string;
  messages: ChatMessage[];
}

export interface ChatSendResponse {
  session_id: string;
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface CategoryEvolutionResponse {
  granularity: CategorySeriesGranularity;
  category: {
    id: number;
    name: string;
  };
  budget: CategoryEvolutionBudget | null;
  category_series: CategoryEvolutionPoint[];
  budget_series?: CategoryEvolutionPoint[];
}

export interface Dashboard {
  summary: DashboardSummary;
  budget_summary?: BudgetSummary;
  monthly_series?: MonthlySeries[];
  top_categories?: TopCategory[];
  budget_series?: BudgetSeries[];
}

// ─── Analytics ────────────────────────────────────────────
export interface AnalyticsSummary {
  income_total: number;
  expense_total: number;
  balance: number;
  expense_ratio: number;
  income_ratio: number;
}

export interface AnalyticsInsight {
  code: string;
  title: string;
  description: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
}

export interface Analytics {
  summary: AnalyticsSummary;
  top_categories?: TopCategory[];
  insights?: AnalyticsInsight[];
}

// ─── API Response ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: number;
  data: T | null;
}

// ─── Paginação ────────────────────────────────────────────
export interface PaginationMetadata {
  count: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: PaginationMetadata;
}

export interface ApiError {
  status: number;
  status_text?: string;
  message?: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

export type FormErrors = Record<string, string[]>;

export interface ActionState<T = null> {
  ok: boolean;
  data?: T;
  errors?: FormErrors;
  message?: string;
}

// ─── Importação de Planilha ───────────────────────────────
export interface ImportPreviewRow {
  row_number: number;
  sheet: string;
  category_name: string;
  description: string;
  day: number | null;
  amount: string | null;
  date: string | null;
  errors: string[];
  is_valid: boolean;
  category_exists: boolean;
}

export interface ImportPreviewResult {
  sheets_found: string[];
  categories_found: string[];
  missing_categories: string[];
  total: number;
  valid_count: number;
  error_count: number;
  rows: ImportPreviewRow[];
}

// ─── Status de Tarefa Assíncrona de Importação ───────────────
export type ImportTaskState =
  | "PENDING"
  | "STARTED"
  | "PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "RETRY"
  | "UNKNOWN";

export interface ImportTaskStatus {
  state: ImportTaskState;
  percent: number;
  created: number;
  skipped: number;
  total: number;
  error: string | null;
}

