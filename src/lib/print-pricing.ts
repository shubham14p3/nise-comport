export const COLOR_PAGE_RATE = 10;

/** The applicable B&W rate is based on the total number of B&W pages in the order. */
export function blackWhiteCost(pageCount: number) {
  const rate = pageCount <= 10 ? 5 : pageCount <= 50 ? 3 : 2;
  return pageCount * rate;
}

export function countSelectedPages(selection: string, documentPages: number) {
  if (selection.trim().toLowerCase() === "all" || selection.trim() === "") return documentPages;
  const selected = new Set<number>();
  for (const rawPart of selection.split(",")) {
    const part = rawPart.trim();
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error("Enter page numbers or ranges like 1-3, 5.");
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > documentPages) {
      throw new Error(`Choose page numbers between 1 and ${documentPages}.`);
    }
    for (let page = start; page <= end; page += 1) {
      if (selected.has(page)) throw new Error("A page appears more than once in your selection.");
      selected.add(page);
    }
  }
  if (!selected.size) throw new Error("Select at least one page.");
  return selected.size;
}

export function couponDiscount(type: string, value: number, subtotal: number) {
  if (type !== "percent" && type !== "fixed") return 0;
  const safeValue = Math.max(0, value);
  const amount = type === "percent" ? subtotal * safeValue / 100 : safeValue;
  return Math.round(Math.min(subtotal, amount) * 100) / 100;
}
