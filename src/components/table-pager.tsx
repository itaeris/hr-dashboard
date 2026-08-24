import {
  PAGE_SIZES,
  pageItems,
  type PageSize,
} from "@/lib/table-page";
import { IconArrowLeft } from "./icons";
import { Select } from "./fields";

export function TablePager({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: PageSize;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">
          {from}–{to} of {total}
        </p>
        <Select
          className="w-[8.5rem]"
          value={String(pageSize)}
          onChange={(next) => onPageSize(Number(next) as PageSize)}
          options={PAGE_SIZES.map((size) => ({
            value: String(size),
            label: `${size} rows`,
          }))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconArrowLeft className="h-4 w-4" />
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-sm text-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPage(item)}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm ${
                item === page
                  ? "bg-accent font-medium text-white"
                  : "border border-line text-ink hover:bg-paper"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconArrowLeft className="h-4 w-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
