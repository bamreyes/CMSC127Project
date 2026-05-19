"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  onFilterClick?: () => void;
  onAddNewClick?: () => void;
  isFiltered?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  title,
  onFilterClick,
  onAddNewClick,
  isFiltered,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 shrink-0">
              {title}
            </h2>
          )}
        </div>
        {(onFilterClick || onAddNewClick) && (
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {onFilterClick && (
              <Button
                variant="outline"
                className={`gap-2 rounded-lg transition-all ${
                  isFiltered
                    ? "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    : "bg-white text-slate-700"
                }`}
                onClick={onFilterClick}
              >
                <Filter className="h-4 w-4" />
                {isFiltered ? "Filtered" : "Filter"}
              </Button>
            )}
            {onAddNewClick && (
              <Button className="gap-2 rounded-lg" onClick={onAddNewClick}>
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-50/50 hover:bg-slate-50/50"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-slate-900 h-11"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-500"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-slate-500">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-8 h-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 hidden sm:flex">
            {table.getPageCount() > 0 &&
              Array.from({ length: table.getPageCount() }).map((_, i) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const isCurrent = pageIndex === i;
                const isNear = Math.abs(pageIndex - i) <= 1;
                const isEdge = i === 0 || i === table.getPageCount() - 1;

                if (!isNear && !isEdge) {
                  if (
                    (i === 1 && pageIndex > 2) ||
                    (i === table.getPageCount() - 2 &&
                      pageIndex < table.getPageCount() - 3)
                  ) {
                    return (
                      <span key={i} className="px-1.5 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Button
                    key={i}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${isCurrent ? "rounded-sm" : ""}`}
                    onClick={() => table.setPageIndex(i)}
                  >
                    {i + 1}
                  </Button>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
