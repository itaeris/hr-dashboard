export const PAGE_SIZES = [10, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export type TableSortKey = "az" | "za" | "newest" | "oldest";

export const TABLE_SORT_OPTIONS: { value: TableSortKey; label: string }[] = [
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export function pageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("gap");
  items.push(total);
  return items;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const from = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  return {
    pageCount,
    currentPage,
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    from,
    to: Math.min(currentPage * pageSize, items.length),
  };
}

export function compareByName(left: string, right: string, descending = false) {
  const compared = left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return descending ? -compared : compared;
}

export function compareByDate(left: string, right: string, newestFirst = true) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  return newestFirst ? rightTime - leftTime : leftTime - rightTime;
}
