/** Bound owner-list pagination even when called outside the encrypted gateway. */
export function customerPage(params: URLSearchParams) {
  const rawPage = Number(params.get("page"));
  const page = Number.isFinite(rawPage) ? Math.max(0, Math.min(100000, Math.floor(rawPage))) : 0;
  const rawSize = Number(params.get("pageSize"));
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : 20;
  return { page, pageSize, offset: page * pageSize };
}
