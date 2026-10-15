// components/common/Pagination.jsx
import Button from "./Button";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords = 0,
  currentCount = 0,
  unit = "records",
  showDetails = true,
}) => {
  const total = Number(totalPages) || 0;
  const current = Number(currentPage) || 1;
  const effectiveTotalRecords = totalRecords || currentCount;

  const getVisiblePages = () => {
    if (total <= 1) return [1];
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }
    if (current - delta > 2) range.unshift("...");
    if (current + delta < total - 1) range.push("...");
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  };

  if (total === 0 && effectiveTotalRecords === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 pb-6 w-full flex flex-col items-center select-none"
    >
      {total >= 1 && (
        <div className="flex justify-center items-center space-x-2 mb-2">
          <Button
            variant="gray"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            icon={faChevronLeft}
            className="px-3 py-2 text-xs"
            aria-label="Previous page"
            animation="shrink"
          />

          {getVisiblePages().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-vgsgray font-medium"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = current === page;
            return (
              <Button
                key={`page-${page}`}
                variant={isCurrent ? "blue" : "gray"}
                animation="shrink"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`min-w-9.5 px-3 py-2 text-xs font-bold ${
                  isCurrent ? "shadow-md" : ""
                }`}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="gray"
            animation="shrink"
            disabled={current >= total || total <= 1}
            onClick={() => onPageChange(current + 1)}
            icon={faChevronRight}
            className="px-3 py-2 text-xs"
            aria-label="Next page"
          />
        </div>
      )}

      {showDetails && effectiveTotalRecords > 0 && (
        <p className="text-center text-[10px] text-vgsgray italic font-medium uppercase tracking-wider">
          Showing {currentCount} of {effectiveTotalRecords} {unit}
        </p>
      )}
    </nav>
  );
};

export default Pagination;
