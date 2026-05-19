import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.ComponentProps<"select"> {
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, hasError, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 pr-10 text-base transition-[color,box-shadow,background-color] outline-none appearance-none cursor-pointer placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/10",
            hasError && "border-destructive text-destructive focus-visible:ring-destructive/30",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center pr-1 text-muted-foreground">
          <svg
            className={cn("h-4 w-4 transition-transform", hasError && "text-destructive")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
