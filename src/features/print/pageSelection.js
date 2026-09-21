export function parsePageSelection(input, totalPages) {
  if (!input?.trim() || !Number.isInteger(totalPages) || totalPages < 1) return [];
  const pages = new Set();
  input.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => {
    if (part.includes("-")) {
      const [rawStart, rawEnd] = part.split("-");
      const start = Number(rawStart);
      const end = Number(rawEnd);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) return;
      for (let page = start; page <= end; page += 1) {
        if (page >= 1 && page <= totalPages) pages.add(page);
      }
      return;
    }
    const page = Number(part);
    if (Number.isInteger(page) && page >= 1 && page <= totalPages) pages.add(page);
  });
  return [...pages].sort((a, b) => a - b);
}

export function formatPageSelection(pages) {
  if (!pages?.length) return "";
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    ranges.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }
  return ranges.join(",");
}
