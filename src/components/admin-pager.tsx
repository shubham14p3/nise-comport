"use client";

type Props = {
  page: number; total: number; pageSize: number; onPage: (page: number) => void;
  onPageSize?: (size: number) => void; label?: string;
};
/** Shared, accessible pagination controls. Page is zero-based; total counts filtered rows. */
export function AdminPager({ page, total, pageSize, onPage, onPageSize, label = "results" }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.max(0, Math.min(page, pages - 1));
  if (total <= pageSize && !onPageSize) return null;
  return <nav className="admin-pagination" aria-label={`Pages of ${label}`}>
    <span className="admin-pagination__summary">{total ? `${current * pageSize + 1}–${Math.min(total, (current + 1) * pageSize)} of ${total.toLocaleString("en-IN")}` : "0 results"}</span>
    {onPageSize && <label className="admin-pagination__size">Rows
      <select aria-label={`Rows per page for ${label}`} value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
        {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
    </label>}
    {total > pageSize && <div className="admin-pagination__buttons">
      <button type="button" className="btn btn--ghost btn--sm" disabled={current === 0} onClick={() => onPage(0)} aria-label="First page">«</button>
      <button type="button" className="btn btn--ghost btn--sm" disabled={current === 0} onClick={() => onPage(current - 1)}>Previous</button>
      <span>Page {current + 1} / {pages}</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={current >= pages - 1} onClick={() => onPage(current + 1)}>Next</button>
      <button type="button" className="btn btn--ghost btn--sm" disabled={current >= pages - 1} onClick={() => onPage(pages - 1)} aria-label="Last page">»</button>
    </div>}
  </nav>;
}

export function paged<T>(items: readonly T[], page: number, size: number): T[] {
  const safePage = Math.max(0, Math.min(page, Math.max(0, Math.ceil(items.length / size) - 1)));
  return items.slice(safePage * size, (safePage + 1) * size);
}
