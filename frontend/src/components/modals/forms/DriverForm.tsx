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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { DatePicker } from "@/components/DatePicker";
import type {
  LicenseStatus,
  LicenseType,
  Sex,
  DriverFormData,
  DriverFilterData,
} from "@shared";
export type { DriverFormData, DriverFilterData };
import { cn } from "@/lib/utils";

import { Select } from "@/components/ui/select";

export const defaultDriverFormData: DriverFormData = {
  license_number: "",
  full_name: "",
  date_of_birth: undefined,
  sex: "M",
  address: "",
  license_type: "" as LicenseType,
  license_status: "Valid",
  issued_at: undefined,
  expires_at: undefined,
};

export const defaultDriverFilterData: DriverFilterData = {
  license_number: "",
  full_name: "",
  date_of_birth_min: undefined,
  date_of_birth_max: undefined,
  sex_m: false,
  sex_f: false,
  address: "",
  license_type_nonpro: false,
  license_type_pro: false,
  license_type_student: false,
  license_status_valid: false,
  license_status_expired: false,
  license_status_suspended: false,
  license_status_revoked: false,
  issued_at_min: undefined,
  issued_at_max: undefined,
  expires_at_min: undefined,
  expires_at_max: undefined,
};

type Props =
  | {
      mode: "create" | "edit";
      formData: DriverFormData;
      onChange: (data: DriverFormData) => void;
      errors?: Record<string, string>;
      filterData?: never;
      onFilterChange?: never;
    }
  | {
      mode: "search";
      filterData: DriverFilterData;
      onFilterChange: (data: DriverFilterData) => void;
      formData?: never;
      onChange?: never;
      errors?: never;
    };

export function DriverForm({
  mode,
  formData,
  onChange,
  errors,
  filterData,
  onFilterChange,
}: Props) {
  const isSearch = mode === "search";

  const set = (field: keyof DriverFormData, value: any) => {
    onChange?.({ ...formData!, [field]: value });
  };

  const setFilter = (field: keyof DriverFilterData, value: any) => {
    onFilterChange?.({ ...filterData!, [field]: value });
  };

  const dob = formData?.date_of_birth;
  let age = 0;
  if (dob) {
    const dobDate = new Date(dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dobDate.getDate())
    ) {
      age--;
    }
  }

  const expiresAt = formData?.expires_at;
  const isExpired = expiresAt
    ? new Date(expiresAt) < new Date(new Date().toDateString())
    : false;

  return (
    <>
      <FieldGroup className="gap-y-6">
        {/* PERSONAL DETAILS SECTION */}
        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.full_name && "text-destructive")}>
            {isSearch ? "Full Name" : "Full Name *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="Juan dela Cruz"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.full_name &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.full_name : formData!.full_name}
              onChange={(e) =>
                isSearch
                  ? setFilter("full_name", e.target.value)
                  : set("full_name", e.target.value)
              }
            />
          </Field>
          {errors?.full_name && (
            <p className="text-xs font-medium text-destructive">
              {errors.full_name}
            </p>
          )}
          <FieldDescription className="text-xs">
            Separate first, middle, and last name with spaces.
          </FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLabel>{isSearch ? "Gender" : "Gender *"}</FieldLabel>
          {isSearch ? (
            <RadioGroup
              value={filterData!.sex_m ? "M" : filterData!.sex_f ? "F" : "All"}
              onValueChange={(v) => {
                if (v === "M") {
                  setFilter("sex_m", true);
                  setFilter("sex_f", false);
                } else if (v === "F") {
                  setFilter("sex_m", false);
                  setFilter("sex_f", true);
                } else {
                  setFilter("sex_m", false);
                  setFilter("sex_f", false);
                }
              }}
            >
              <Field orientation="horizontal">
                <RadioGroupItem value="All" id="gender-all" />
                <FieldLabel htmlFor="gender-all" className="font-normal">
                  All
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="M" id="gender-m" />
                <FieldLabel htmlFor="gender-m" className="font-normal">
                  M
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="F" id="gender-f" />
                <FieldLabel htmlFor="gender-f" className="font-normal">
                  F
                </FieldLabel>
              </Field>
            </RadioGroup>
          ) : (
            <Field>
              <Select
                value={formData!.sex}
                onChange={(e) => set("sex", e.target.value as Sex)}
                hasError={!!errors?.sex}
              >
                <option value="M" className="bg-background text-foreground">
                  Male
                </option>
                <option value="F" className="bg-background text-foreground">
                  Female
                </option>
              </Select>
              {errors?.sex && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.sex}
                </p>
              )}
            </Field>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.date_of_birth && "text-destructive")}
          >
            {isSearch ? "Birthdate" : "Birthdate *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.date_of_birth_min}
                onSelect={(d) => setFilter("date_of_birth_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.date_of_birth_max}
                onSelect={(d) => setFilter("date_of_birth_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.date_of_birth}
              onSelect={(d) => {
                onChange?.({
                  ...formData!,
                  date_of_birth: d,
                  license_type: "" as LicenseType,
                });
              }}
              hasError={!!errors?.date_of_birth}
              className="w-full"
            />
          )}
          {errors?.date_of_birth && (
            <p className="text-xs font-medium text-destructive">
              {errors.date_of_birth}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.address && "text-destructive")}>
            {isSearch ? "Address" : "Address *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="123 Rizal St, Sampaloc, Manila"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.address &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              value={isSearch ? filterData!.address : formData!.address}
              onChange={(e) =>
                isSearch
                  ? setFilter("address", e.target.value)
                  : set("address", e.target.value)
              }
            />
          </Field>
          {errors?.address && (
            <p className="text-xs font-medium text-destructive">
              {errors.address}
            </p>
          )}
          <FieldDescription className="text-xs">
            Separate with commas.
          </FieldDescription>
        </FieldSet>

        <FieldSeparator />

        {/* LICENSE DETAILS SECTION */}
        <FieldSet className="gap-y-2">
          <FieldLabel
            className={cn(errors?.license_number && "text-destructive")}
          >
            {isSearch ? "License No." : "License No. *"}
          </FieldLabel>
          <Field>
            <Input
              placeholder="N01-12-345678"
              className={cn(
                "rounded-md text-sm transition-all",
                errors?.license_number &&
                  "border-destructive text-destructive focus-visible:ring-destructive/30",
              )}
              readOnly={mode === "edit"}
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

          {mode === "edit" ? (
            <FieldDescription className="text-xs text-slate-400">
              License no. cannot be changed.
            </FieldDescription>
          ) : (
            <FieldDescription className="text-xs">
              Include hyphens.
            </FieldDescription>
          )}
        </FieldSet>

        <FieldSet>
          <FieldLabel
            className={cn(errors?.license_type && "text-destructive")}
          >
            {isSearch ? "Type" : "Type *"}
          </FieldLabel>
          {isSearch ? (
            <Field>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 -mt-2.5">
                  <Checkbox
                    id="license-checkbox-nonpro"
                    checked={filterData!.license_type_nonpro}
                    onCheckedChange={(v) =>
                      setFilter("license_type_nonpro", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-nonpro"
                  >
                    Non-Professional
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="license-checkbox-pro"
                    checked={filterData!.license_type_pro}
                    onCheckedChange={(v) => setFilter("license_type_pro", !!v)}
                  />
                  <Label className="font-normal" htmlFor="license-checkbox-pro">
                    Professional
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="license-checkbox-student"
                    checked={filterData!.license_type_student}
                    onCheckedChange={(v) =>
                      setFilter("license_type_student", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-student"
                  >
                    Student Permit
                  </Label>
                </div>
              </div>
            </Field>
          ) : (
            <Field>
              <Select
                value={formData!.license_type}
                onChange={(e) =>
                  set("license_type", e.target.value as LicenseType)
                }
                hasError={!!errors?.license_type}
              >
                <option
                  value=""
                  disabled
                  className="bg-background text-foreground"
                >
                  Select License Type...
                </option>
                <option
                  value="Non-Professional"
                  className="bg-background text-foreground"
                  disabled={!!dob && age < 17}
                >
                  Non-Professional{" "}
                  {!!dob && age < 17 ? "(Age 17+ Required)" : ""}
                </option>
                <option
                  value="Professional"
                  className="bg-background text-foreground"
                  disabled={!!dob && age < 18}
                >
                  Professional {!!dob && age < 18 ? "(Age 18+ Required)" : ""}
                </option>
                <option
                  value="Student Permit"
                  className="bg-background text-foreground"
                  disabled={!!dob && age < 16}
                >
                  Student Permit {!!dob && age < 16 ? "(Age 16+ Required)" : ""}
                </option>
              </Select>
              {errors?.license_type && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.license_type}
                </p>
              )}
            </Field>
          )}
        </FieldSet>

        <FieldSet>
          <FieldLabel
            className={cn(errors?.license_status && "text-destructive")}
          >
            {isSearch ? "Status" : "Status *"}
          </FieldLabel>
          {isSearch ? (
            <Field>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 -mt-2.5">
                  <Checkbox
                    id="license-checkbox-valid"
                    checked={filterData!.license_status_valid}
                    onCheckedChange={(v) =>
                      setFilter("license_status_valid", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-valid"
                  >
                    Valid
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="license-checkbox-expired"
                    checked={filterData!.license_status_expired}
                    onCheckedChange={(v) =>
                      setFilter("license_status_expired", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-expired"
                  >
                    Expired
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="license-checkbox-suspended"
                    checked={filterData!.license_status_suspended}
                    onCheckedChange={(v) =>
                      setFilter("license_status_suspended", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-suspended"
                  >
                    Suspended
                  </Label>
                </div>
                <div className="flex flex-row gap-3">
                  <Checkbox
                    id="license-checkbox-revoked"
                    checked={filterData!.license_status_revoked}
                    onCheckedChange={(v) =>
                      setFilter("license_status_revoked", !!v)
                    }
                  />
                  <Label
                    className="font-normal"
                    htmlFor="license-checkbox-revoked"
                  >
                    Revoked
                  </Label>
                </div>
              </div>
            </Field>
          ) : (
            <Field>
              <Select
                value={formData!.license_status}
                onChange={(e) =>
                  set("license_status", e.target.value as LicenseStatus)
                }
                hasError={!!errors?.license_status}
              >
                <option
                  value="Valid"
                  className="bg-background text-foreground"
                  disabled={isExpired}
                >
                  Valid {isExpired ? "(License Expired)" : ""}
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
                <option
                  value="Revoked"
                  className="bg-background text-foreground"
                >
                  Revoked
                </option>
              </Select>
              {errors?.license_status && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.license_status}
                </p>
              )}
            </Field>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.issued_at && "text-destructive")}>
            {isSearch ? "License Issued" : "License Issued *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.issued_at_min}
                onSelect={(d) => setFilter("issued_at_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.issued_at_max}
                onSelect={(d) => setFilter("issued_at_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.issued_at}
              onSelect={(d) => set("issued_at", d)}
              hasError={!!errors?.issued_at}
              className="w-full"
            />
          )}
          {errors?.issued_at && (
            <p className="text-xs font-medium text-destructive">
              {errors.issued_at}
            </p>
          )}
        </FieldSet>

        <FieldSet className="gap-y-2">
          <FieldLabel className={cn(errors?.expires_at && "text-destructive")}>
            {isSearch ? "Expiry Date" : "Expiry Date *"}
          </FieldLabel>
          {isSearch ? (
            <div className="flex flex-row gap-2 w-full">
              <DatePicker
                placeholder="Min"
                selected={filterData!.expires_at_min}
                onSelect={(d) => setFilter("expires_at_min", d)}
                className="w-full"
              />
              <DatePicker
                placeholder="Max"
                selected={filterData!.expires_at_max}
                onSelect={(d) => setFilter("expires_at_max", d)}
                className="w-full"
              />
            </div>
          ) : (
            <DatePicker
              selected={formData!.expires_at}
              onSelect={(d) => {
                const newExpired = d
                  ? new Date(d) < new Date(new Date().toDateString())
                  : false;
                if (newExpired && formData!.license_status === "Valid") {
                  onChange?.({
                    ...formData!,
                    expires_at: d,
                    license_status: "Expired" as LicenseStatus,
                  });
                } else {
                  set("expires_at", d);
                }
              }}
              hasError={!!errors?.expires_at}
              className="w-full"
            />
          )}
          {errors?.expires_at && (
            <p className="text-xs font-medium text-destructive">
              {errors.expires_at}
            </p>
          )}
        </FieldSet>
      </FieldGroup>
    </>
  );
}
