import type { VehicleType, VehicleFormData, VehicleFilterData } from "@shared";
export type { VehicleFormData, VehicleFilterData };
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
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

export const defaultVehicleFormData: VehicleFormData = {
  plate_number: "",
  license_number: "",
  engine_number: "",
  chassis_number: "",
  make: "",
  model: "",
  year: "",
  vehicle_type: "Private Car",
  color: "",
};

export const defaultVehicleFilterData: VehicleFilterData = {
  plate_number: "",
  license_number: "",
  engine_number: "",
  chassis_number: "",
  make: "",
  model: "",
  min_year: "",
  max_year: "",
  vehicle_type_private: false,
  vehicle_type_puv: false,
  vehicle_type_motor: false,
  color: "",
};

type Props =
  | {
      mode: "create" | "edit";
      formData: VehicleFormData;
      onChange: (data: VehicleFormData) => void;
      errors?: Record<string, string>;
      filterData?: never;
      onFilterChange?: never;
    }
  | {
      mode: "search";
      filterData: VehicleFilterData;
      onFilterChange: (data: VehicleFilterData) => void;
      formData?: never;
      onChange?: never;
      errors?: never;
    };

export function VehicleForm({
  mode,
  formData,
  onChange,
  errors,
  filterData,
  onFilterChange,
}: Props) {
  const isSearch = mode === "search";

  const set = (field: keyof VehicleFormData, value: any) => {
    onChange?.({ ...formData!, [field]: value });
  };

  const setFilter = (field: keyof VehicleFilterData, value: any) => {
    onFilterChange?.({ ...filterData!, [field]: value });
  };

  return (
    <>
      <FieldGroup className="gap-y-6">
        {/* IDENTIFICATION & VEHICLE INFO */}
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
              readOnly={mode === "edit"}
              value={
                isSearch ? filterData!.plate_number : formData!.plate_number
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("plate_number", e.target.value)
                  : set("plate_number", e.target.value)
              }
            />
          </Field>
          {errors?.plate_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.plate_number}
            </p>
          )}

          {mode === "edit" ? (
            <FieldDescription className="text-xs text-slate-400">
              Plate no. cannot be changed.
            </FieldDescription>
          ) : (
            <FieldDescription className="text-xs">
              Separate with spaces.
            </FieldDescription>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.license_number && "text-destructive")}
          >
            {isSearch ? "Driver" : "Driver *"}
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
          <FieldLabel className={cn(errors?.make && "text-destructive")}>
            {isSearch ? "Make" : "Make *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Toyota"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.make &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.make : formData!.make}
              onChange={(e) =>
                isSearch
                  ? setFilter("make", e.target.value)
                  : set("make", e.target.value)
              }
            />
          </Field>
          {errors?.make && (
            <p className="text-xs font-medium text-destructive">
              {errors.make}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.model && "text-destructive")}>
            {isSearch ? "Model" : "Model *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Corolla"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.model &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.model : formData!.model}
              onChange={(e) =>
                isSearch
                  ? setFilter("model", e.target.value)
                  : set("model", e.target.value)
              }
            />
          </Field>
          {errors?.model && (
            <p className="text-xs font-medium text-destructive">
              {errors.model}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.year && "text-destructive")}>
            {isSearch ? "Year" : "Year *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2">
              <Field>
                <Input
                  placeholder="Min"
                  className="rounded-md text-sm w-24"
                  type="number"
                  min={1886}
                  max={new Date().getFullYear() + 10}
                  step={1}
                  value={filterData!.min_year}
                  onChange={(e) =>
                    setFilter(
                      "min_year",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
              <Field>
                <Input
                  placeholder="Max"
                  className="rounded-md text-sm w-24"
                  type="number"
                  min={1886}
                  max={new Date().getFullYear() + 10}
                  step={1}
                  value={filterData!.max_year}
                  onChange={(e) =>
                    setFilter(
                      "max_year",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
            </div>
          ) : (
            <Field>
              <Input
                placeholder="2021"
                className={cn(
                  "rounded-md text-sm transition-all",
                  errors?.year &&
                    "border-destructive text-destructive focus-visible:ring-destructive/30",
                )}
                type="number"
                min={1886}
                max={new Date().getFullYear() + 10}
                step={1}
                value={formData!.year}
                onChange={(e) =>
                  set(
                    "year",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
          )}
          {errors?.year && (
            <p className="text-xs font-medium text-destructive">
              {errors.year}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.color && "text-destructive")}>
            {isSearch ? "Color" : "Color *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Classic Silver Metallic"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.color &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.color : formData!.color}
              onChange={(e) =>
                isSearch
                  ? setFilter("color", e.target.value)
                  : set("color", e.target.value)
              }
            />
          </Field>
          {errors?.color && (
            <p className="text-xs font-medium text-destructive">
              {errors.color}
            </p>
          )}
        </FieldSet>

        <FieldSet>
          <FieldLabel>{isSearch ? "Type" : "Type *"}</FieldLabel>
          {isSearch ? (
            <Field>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 -mt-2.5">
                  <Checkbox
                    id="vehicle-checkbox-private"
                    checked={filterData!.vehicle_type_private}
                    onCheckedChange={(v) =>
                      setFilter("vehicle_type_private", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="vehicle-checkbox-private"
                  >
                    Private Car
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="vehicle-checkbox-puv"
                    checked={filterData!.vehicle_type_puv}
                    onCheckedChange={(v) => setFilter("vehicle_type_puv", !!v)}
                  />
                  <Label className="font-normal" htmlFor="vehicle-checkbox-puv">
                    Public Utility Vehicle
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="vehicle-checkbox-motor"
                    checked={filterData!.vehicle_type_motor}
                    onCheckedChange={(v) =>
                      setFilter("vehicle_type_motor", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="vehicle-checkbox-motor"
                  >
                    Motorcycle
                  </Label>
                </div>
              </div>
            </Field>
          ) : (
            <Field>
              <Select
                value={formData!.vehicle_type}
                onChange={(e) =>
                  set("vehicle_type", e.target.value as VehicleType)
                }
                hasError={!!errors?.vehicle_type}
              >
                <option
                  value="Private Car"
                  className="bg-background text-foreground"
                >
                  Private Car
                </option>
                <option
                  value="Public Utility Vehicle"
                  className="bg-background text-foreground"
                >
                  Public Utility Vehicle
                </option>
                <option
                  value="Motorcycle"
                  className="bg-background text-foreground"
                >
                  Motorcycle
                </option>
              </Select>
              {errors?.vehicle_type && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.vehicle_type}
                </p>
              )}
            </Field>
          )}
        </FieldSet>

        <FieldSeparator />

        {/* MECHANICAL DETAILS */}
        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.engine_number && "text-destructive")}
          >
            {isSearch ? "Engine No." : "Engine No. *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="ENG-123456"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.engine_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch ? filterData!.engine_number : formData!.engine_number
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("engine_number", e.target.value)
                  : set("engine_number", e.target.value)
              }
            />
          </Field>
          {errors?.engine_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.engine_number}
            </p>
          )}
          <FieldDescription className="text-xs">
            Include hyphen.
          </FieldDescription>
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.chassis_number && "text-destructive")}
          >
            {isSearch ? "Chassis No." : "Chassis No. *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="CHA-123456"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.chassis_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={
                isSearch ? filterData!.chassis_number : formData!.chassis_number
              }
              onChange={(e) =>
                isSearch
                  ? setFilter("chassis_number", e.target.value)
                  : set("chassis_number", e.target.value)
              }
            />
          </Field>
          {errors?.chassis_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.chassis_number}
            </p>
          )}
          <FieldDescription className="text-xs">
            Include hyphen.
          </FieldDescription>
        </FieldSet>
      </FieldGroup>
    </>
  );
}
