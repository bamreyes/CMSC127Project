import type {
  ViolationStatus,
  ViolationFormData,
  ViolationFilterData,
} from "@shared";
export type { ViolationFormData, ViolationFilterData };
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { DatePicker } from "@/components/DatePicker";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

export const defaultViolationFormData: ViolationFormData = {
  date: undefined,
  license_number: "",
  plate_number: "",
  location: "",
  violation_type: "",
  fine_amount: "",
  apprehending_officer: "",
  violation_status: "Unpaid",
};

export const defaultViolationFilterData: ViolationFilterData = {
  date_min: undefined,
  date_max: undefined,
  license_number: "",
  plate_number: "",
  location: "",
  violation_type: "",
  min_fine_amount: "",
  max_fine_amount: "",
  apprehending_officer: "",
  violation_status_unpaid: false,
  violation_status_paid: false,
  violation_status_contested: false,
};

type Props =
  | {
      mode: "create" | "edit";
      formData: ViolationFormData;
      onChange: (data: ViolationFormData) => void;
      errors?: Record<string, string>;
      filterData?: never;
      onFilterChange?: never;
    }
  | {
      mode: "search";
      filterData: ViolationFilterData;
      onFilterChange: (data: ViolationFilterData) => void;
      formData?: never;
      onChange?: never;
      errors?: never;
    };

export function ViolationForm({
  mode,
  formData,
  onChange,
  errors,
  filterData,
  onFilterChange,
}: Props) {
  const isSearch = mode === "search";

  const set = (field: keyof ViolationFormData, value: any) => {
    onChange?.({ ...formData!, [field]: value });
  };

  const setFilter = (field: keyof ViolationFilterData, value: any) => {
    onFilterChange?.({ ...filterData!, [field]: value });
  };

  return (
    <>
      <FieldGroup className="gap-y-6">
        {/* IDENTIFICATION */}
        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.license_number && "text-destructive")}
          >
            {isSearch ? "Violator" : "Violator *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="N01-12-345678"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.license_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch ? filterData!.license_number : formData!.license_number
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("license_number", e.target.value)
                  : set("license_number", e.target.value)
              }
              disabled={mode === "edit"}
            />
          </Field>
          {errors?.license_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.license_number}
            </p>
          )}
          <FieldDescription className="text-xs">
            Enter license no. and include hyphens.
          </FieldDescription>
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.plate_number && "text-destructive")}
          >
            {isSearch ? "Plate No." : "Plate No. *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="ABC 1234"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.plate_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch ? filterData!.plate_number : formData!.plate_number
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("plate_number", e.target.value)
                  : set("plate_number", e.target.value)
              }
              disabled={mode === "edit"}
            />
          </Field>
          {errors?.plate_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.plate_number}
            </p>
          )}
          <FieldDescription className="text-xs">
            Separate with spaces.
          </FieldDescription>
        </FieldSet>

        {/* VIOLATION DETAILS */}
        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.violation_type && "text-destructive")}
          >
            {isSearch ? "Violation" : "Violation *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Illegal Parking"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.violation_type &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch ? filterData!.violation_type : formData!.violation_type
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("violation_type", e.target.value)
                  : set("violation_type", e.target.value)
              }
              disabled={mode === "edit"}
            />
          </Field>
          {errors?.violation_type && (
            <p className="text-xs font-medium text-destructive">
              {errors.violation_type}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.fine_amount && "text-destructive")}>
            {isSearch ? "Fine Amount" : "Fine Amount *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2">
              <Field>
                <Input
                  placeholder="Min"
                  className="rounded-md text-sm w-28"
                  type="number"
                  min={0}
                  step={0.01}
                  value={filterData!.min_fine_amount}
                  onChange={(e) =>
                    setFilter(
                      "min_fine_amount",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
              <Field>
                <Input
                  placeholder="Max"
                  className="rounded-md text-sm w-28"
                  type="number"
                  min={0}
                  step={0.01}
                  value={filterData!.max_fine_amount}
                  onChange={(e) =>
                    setFilter(
                      "max_fine_amount",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
            </div>
          ) : (
            <Field>
              <Input
                placeholder="1000"
                className={cn(
                  "rounded-md text-sm transition-all",
                  errors?.fine_amount &&
                    "border-destructive text-destructive focus-visible:ring-destructive/30",
                )}
                type="number"
                min={0}
                step={0.01}
                value={formData!.fine_amount}
                onChange={(e) =>
                  set(
                    "fine_amount",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
          )}
          {errors?.fine_amount && (
            <p className="text-xs font-medium text-destructive">
              {errors.fine_amount}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.location && "text-destructive")}>
            {isSearch ? "Location" : "Location *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Sampaloc, Manila"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.location &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.location : formData!.location}
              onChange={(e) =>
                isSearch
                  ? setFilter("location", e.target.value)
                  : set("location", e.target.value)
              }
            />
          </Field>
          {errors?.location && (
            <p className="text-xs font-medium text-destructive">
              {errors.location}
            </p>
          )}
          <FieldDescription className="text-xs">
            Separate with commas.
          </FieldDescription>
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.date && "text-destructive")}>
            {isSearch ? "Date" : "Date *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.date_min}
                onSelect={(d) => setFilter("date_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.date_max}
                onSelect={(d) => setFilter("date_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.date}
              onSelect={(d) => set("date", d)}
              disabled={mode === "edit"}
              hasError={!!errors?.date}
              className="w-full"
            />
          )}
          {errors?.date && (
            <p className="text-xs font-medium text-destructive">
              {errors.date}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.apprehending_officer && "text-destructive")}
          >
            Officer
          </FieldLabel>
          <Field>
            <Input
              placeholder="Juan dela Cruz"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.apprehending_officer &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch
                  ? filterData!.apprehending_officer
                  : formData!.apprehending_officer
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("apprehending_officer", e.target.value)
                  : set("apprehending_officer", e.target.value)
              }
              disabled={mode === "edit"}
            />
          </Field>
          {errors?.apprehending_officer && (
            <p className="text-xs font-medium text-destructive">
              {errors.apprehending_officer}
            </p>
          )}
          <FieldDescription className="text-xs">
            Separate first, middle, and last name with spaces.
          </FieldDescription>
        </FieldSet>

        <FieldSeparator />

        {/* PAYMENT STATUS */}
        <FieldSet>
          <FieldLabel>{isSearch ? "Status" : "Status *"}</FieldLabel>
          {isSearch ? (
            <Field>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 -mt-2.5">
                  <Checkbox
                    id="violation-checkbox-unpaid"
                    checked={filterData!.violation_status_unpaid}
                    onCheckedChange={(v) =>
                      setFilter("violation_status_unpaid", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="violation-checkbox-unpaid"
                  >
                    Unpaid
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="violation-checkbox-paid"
                    checked={filterData!.violation_status_paid}
                    onCheckedChange={(v) =>
                      setFilter("violation_status_paid", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="violation-checkbox-paid"
                  >
                    Paid
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="violation-checkbox-contested"
                    checked={filterData!.violation_status_contested}
                    onCheckedChange={(v) =>
                      setFilter("violation_status_contested", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="violation-checkbox-contested"
                  >
                    Contested
                  </Label>
                </div>
              </div>
            </Field>
          ) : (
            <Field>
              <Select
                value={formData!.violation_status}
                onChange={(e) =>
                  set("violation_status", e.target.value as ViolationStatus)
                }
                hasError={!!errors?.violation_status}
              >
                <option
                  value="Unpaid"
                  className="bg-background text-foreground"
                >
                  Unpaid
                </option>
                <option value="Paid" className="bg-background text-foreground">
                  Paid
                </option>
                <option
                  value="Contested"
                  className="bg-background text-foreground"
                >
                  Contested
                </option>
              </Select>
              {errors?.violation_status && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.violation_status}
                </p>
              )}
            </Field>
          )}
        </FieldSet>
      </FieldGroup>
    </>
  );
}
