"use client";

import { Button } from "@heroui/react";

import { toPersianDigits } from "@/common/utils";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  onPage: (page: number) => void;
};

export function AdminPagination({
  page,
  totalPages,
  total,
  onPage,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !total) return null;

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      {total != null ? (
        <p className="text-sm text-muted">
          مجموع {toPersianDigits(total)} رکورد
        </p>
      ) : (
        <span />
      )}
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => onPage(page - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => onPage(page + 1)}
          >
            بعدی
          </Button>
        </div>
      ) : null}
    </div>
  );
}
