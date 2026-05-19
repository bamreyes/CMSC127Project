import type {
  RegistrationStatus,
  RegistrationFormData,
  RegistrationFilterData,
} from "@shared";
export type { RegistrationFormData, RegistrationFilterData };
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

export const defaultRegistrationFormData: RegistrationFormData = {
  registration_number: "",
  plate_number: "",
  registration_status: "Active",
  registration_date: undefined,
  expiration_date: undefined,
};

export const defaultRegistrationFilterData: RegistrationFilterData = {
  registration_number: "",
  plate_number: "",
  registration_status_active: false,
  registration_status_expired: false,
  registration_status_suspended: false,
  registration_date_min: undefined,
  registration_date_max: undefined,
  expiration_date_min: undefined,
  expiration_date_max: undefined,
};

type Props =
  | {
      mode: "create" | "edit";
      formData: RegistrationFormData;
      onChange: (data: RegistrationFormData) => void;
      errors?: Record<string, string>;
      filterData?: never;
      onFilterChange?: never;
    }
  | {
      mode: "search";
      filterData: RegistrationFilterData;
      onFilterChange: (data: RegistrationFilterData) => void;
      formData?: never;
      onChange?: never;
      errors?: never;
    };

export function RegistrationForm({
  mode,
  formData,
  onChange,
  errors,
  filterData,
  onFilterChange,
}: Props) {
  const isSearch = mode === "search";

  const set = (field: keyof RegistrationFormData, value: any) => {
    onChange?.({ ...formData!, [field]: value });
  };

  const setFilter = (field: keyof RegistrationFilterData, value: any) => {
    onFilterChange?.({ ...filterData!, [field]: value });
  };

  return (
    <>
      <FieldGroup className="gap-y-6">
        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.registration_number && "text-destructive")}
          >
            {isSearch ? "Registration No." : "Registration No. *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="0001"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.registration_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              type="number"
              min={0}
              step={1}
              readOnly={mode === "edit"}
              value={
                isSearch
                  ? filterData!.registration_number
                  : formData!.registration_number
              }
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                isSearch
                  ? setFilter("registration_number", val)
                  : set("registration_number", val);
              }}
            />
          </Field>
          {errors?.registration_number && (
            <p className="text-xs font-medium text-destructive">
              {errors.registration_number}
            </p>
          )}

          {mode === "edit" && (
            <FieldDescription className="text-xs text-slate-400">
              Registration no. cannot be changed.
            </FieldDescription>
          )}
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
          <FieldDescription className="text-xs">
            {mode === "edit"
              ? "Plate number cannot be transferred to another vehicle."
              : "Separate with spaces."}
          </FieldDescription>
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.registration_date && "text-destructive")}
          >
            {isSearch ? "Registration Date" : "Registration Date *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.registration_date_min}
                onSelect={(d) => setFilter("registration_date_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.registration_date_max}
                onSelect={(d) => setFilter("registration_date_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.registration_date}
              onSelect={(d) => set("registration_date", d)}
              hasError={!!errors?.registration_date}
              className="w-full"
            />
          )}
          {errors?.registration_date && (
            <p className="text-xs font-medium text-destructive">
              {errors.registration_date}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.expiration_date && "text-destructive")}
          >
            {isSearch ? "Expiration Date" : "Expiration Date *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.expiration_date_min}
                onSelect={(d) => setFilter("expiration_date_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.expiration_date_max}
                onSelect={(d) => setFilter("expiration_date_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.expiration_date}
              onSelect={(d) => set("expiration_date", d)}
              hasError={!!errors?.expiration_date}
              className="w-full"
            />
          )}
          {errors?.expiration_date && (
            <p className="text-xs font-medium text-destructive">
              {errors.expiration_date}
            </p>
          )}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLabel>{isSearch ? "Status" : "Status *"}</FieldLabel>
          {isSearch ? (
            <Field>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 -mt-2.5">
                  <Checkbox
                    id="registration-checkbox-active"
                    checked={filterData!.registration_status_active}
                    onCheckedChange={(v) =>
                      setFilter("registration_status_active", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="registration-checkbox-active"
                  >
                    Active
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="registration-checkbox-expired"
                    checked={filterData!.registration_status_expired}
                    onCheckedChange={(v) =>
                      setFilter("registration_status_expired", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="registration-checkbox-expired"
                  >
                    Expired
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="registration-checkbox-suspended"
                    checked={filterData!.registration_status_suspended}
                    onCheckedChange={(v) =>
                      setFilter("registration_status_suspended", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="registration-checkbox-suspended"
                  >
                    Suspended
                  </Label>
                </div>
              </div>
            </Field>
          ) : (
            <Field>
              <Select
                value={formData!.registration_status}
                onChange={(e) =>
                  set(
                    "registration_status",
                    e.target.value as RegistrationStatus,
                  )
                }
                hasError={!!errors?.registration_status}
              >
                <option
                  value="Active"
                  className="bg-background text-foreground"
                >
                  Active
                </option>
                <option
                  value="Expired"
                  className="bg-background text-foreground"
                >
                  Expired
                </option>
                <option
                  value="Suspended"
                  className="bg-background text-foreground"
                >
                  Suspended
                </option>
              </Select>
              {errors?.registration_status && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.registration_status}
                </p>
              )}
            </Field>
          )}
        </FieldSet>
      </FieldGroup>
    </>
  );
}
