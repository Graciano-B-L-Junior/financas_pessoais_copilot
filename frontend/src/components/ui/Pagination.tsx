import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pathname: string;
  searchParams: Record<string, string | undefined>;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  hasNext,
  hasPrevious,
  pathname,
  searchParams,
}: PaginationProps) {
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    
    // Preservar todos os query params existentes
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== "page" && value !== undefined && value !== "") {
        params.set(key, value);
      }
    });
    
    params.set("page", String(pageNum));
    return `${pathname}?${params.toString()}`;
  };

  const prevUrl = buildPageUrl(page - 1);
  const nextUrl = buildPageUrl(page + 1);

  return (
    <nav 
      className="pagination-nav" 
      aria-label="Paginação de lançamentos"
      role="navigation"
    >
      <div className="pagination-controls">
        {hasPrevious ? (
          <Link 
            href={prevUrl} 
            className="btn btn--primary pagination-btn pagination-btn--prev"
            aria-label={`Ir para página anterior (${page - 1})`}
          >
            ← Anterior
          </Link>
        ) : (
          <button 
            className="btn btn--primary pagination-btn pagination-btn--prev" 
            disabled 
            aria-disabled="true"
          >
            ← Anterior
          </button>
        )}

        <div className="pagination-info">
          <span className="pagination-page">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <span className="pagination-count" aria-label={`Total de ${totalCount} registros`}>
            {totalCount} registros
          </span>
        </div>

        {hasNext ? (
          <Link 
            href={nextUrl} 
            className="btn btn--primary pagination-btn pagination-btn--next"
            aria-label={`Ir para próxima página (${page + 1})`}
          >
            Próxima →
          </Link>
        ) : (
          <button 
            className="btn btn--primary pagination-btn pagination-btn--next" 
            disabled 
            aria-disabled="true"
          >
            Próxima →
          </button>
        )}
      </div>
    </nav>
  );
}
