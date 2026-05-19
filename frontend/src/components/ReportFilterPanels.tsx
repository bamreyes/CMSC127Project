import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  DriverFilter,
  LicenseType,
  LicenseStatus,
  Sex,
  RegistrationFilter,
  ViolationFilter,
} from "@shared";

// dropdown helper for filter inputs -----------------------------------------
const SelectField = ({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-slate-200 rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none appearance-auto focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-colors h-9"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);


// ----- COMPONENT PANELS -----------------------------------------------------------------------------------------

// 1. Drivers Filter Panel ("Drivers by Filter") -----------------------------------------------------------------
export const DriversFilterPanel = ({
  value,
  onChange,
}: {
  value: DriverFilter;
  onChange: (v: DriverFilter) => void;
}) => (
  <FieldGroup className="gap-y-4">
    <FieldSet className="gap-y-1.5">
      <FieldLabel>License Type</FieldLabel>
      <Field>
        <SelectField
          value={value.license_type ?? ""}
          onChange={(v) =>
            onChange({ ...value, license_type: v as LicenseType })
          }
          placeholder="Select license type"
          options={[
            { value: "Non-Professional", label: "Non-Professional" },
            { value: "Professional", label: "Professional" },
            { value: "Student Permit", label: "Student Permit" },
          ]}
        />
      </Field>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>License Status</FieldLabel>
      <Field>
        <SelectField
          value={value.license_status ?? ""}
          onChange={(v) =>
            onChange({ ...value, license_status: v as LicenseStatus })
          }
          placeholder="Select status"
          options={[
            { value: "Valid", label: "Valid" },
            { value: "Expired", label: "Expired" },
            { value: "Suspended", label: "Suspended" },
            { value: "Revoked", label: "Revoked" },
          ]}
        />
      </Field>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>Age Range</FieldLabel>
      <div className="flex gap-2">
        <Field className="flex-1">
          <Input
            type="number"
            placeholder="Min age"
            value={value.min_age ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                min_age: isNaN(e.target.valueAsNumber)
                  ? undefined
                  : e.target.valueAsNumber,
              })
            }
          />
        </Field>
        <Field className="flex-1">
          <Input
            type="number"
            placeholder="Max age"
            value={value.max_age ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                max_age: isNaN(e.target.valueAsNumber)
                  ? undefined
                  : e.target.valueAsNumber,
              })
            }
          />
        </Field>
      </div>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>Sex</FieldLabel>
      <Field>
        <SelectField
          value={value.sex ?? ""}
          onChange={(v) => onChange({ ...value, sex: v as Sex })}
          placeholder="Select sex"
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
        />
      </Field>
    </FieldSet>
  </FieldGroup>
);

// 2. Vehicles By Driver Panel ("Vehicles by Driver") -------------------------------------------------------------
export const VehiclesByDriverPanel = ({
  value,
  onChange,
}: {
  value: DriverFilter;
  onChange: (v: DriverFilter) => void;
}) => (
  <FieldSet className="gap-y-1.5">
    <FieldLabel>Driver's License Number</FieldLabel>
    <Field>
      <Input
        placeholder="Enter driver's license number"
        value={value.license_number ?? ""}
        onChange={(e) => onChange({ ...value, license_number: e.target.value })}
      />
    </Field>
  </FieldSet>
);

// 3. Expired Registrations Panel ("Expired Vehicle Registrations") -----------------------------------------------
export const ExpiredRegistrationsPanel = ({
  value,
  onChange,
}: {
  value: RegistrationFilter;
  onChange: (v: RegistrationFilter) => void;
}) => (
  <FieldSet className="gap-y-1.5">
    <FieldLabel>As of Date</FieldLabel>
    <Field>
      <Input
        type="date"
        onChange={(e) => onChange({ ...value, max_date: e.target.value })}
      />
    </Field>
  </FieldSet>
);

// 4. Expired Licenses Panel ("Expired or Suspended Licenses") -----------------------------------------------------
export const ExpiredLicensesPanel = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <FieldSet className="gap-y-1.5">
    <FieldLabel>As of Date</FieldLabel>
    <Field>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  </FieldSet>
);

// 5. Violations By Driver Panel ("Violations by Driver") ---------------------------------------------------------
export const ViolationsByDriverPanel = ({
  value,
  onChange,
}: {
  value: ViolationFilter;
  onChange: (v: ViolationFilter) => void;
}) => (
  <FieldGroup className="gap-y-4">
    <FieldSet className="gap-y-1.5">
      <FieldLabel>Driver's License Number</FieldLabel>
      <Field>
        <Input
          placeholder="Enter driver's license number"
          onChange={(e) =>
            onChange({ ...value, license_number: e.target.value })
          }
        />
      </Field>
    </FieldSet>
  </FieldGroup>
);

export const ViolationsByTypePanel = ({
  value,
  onChange,
}: {
  value: ViolationFilter;
  onChange: (v: ViolationFilter) => void;
}) => (
  <FieldSet className="gap-y-1.5">
    <FieldLabel>Year</FieldLabel>
    <Field>
      <Input
        type="number"
        placeholder="e.g. 2024"
        value={value.year || ""}
        onChange={(e) => onChange({ ...value, year: e.target.valueAsNumber })}
      />
    </Field>
  </FieldSet>
);

// 7. Violations By Location Panel ("Violations by Location") -----------------------------------------------------
export const ViolationsByLocationPanel = ({
  value,
  onChange,
}: {
  value: ViolationFilter;
  onChange: (v: ViolationFilter) => void;
}) => (
  <FieldSet className="gap-y-1.5">
    <FieldLabel>City / Region</FieldLabel>
    <Field>
      <Input
        placeholder="Enter city or region"
        value={value.location ?? ""}
        onChange={(e) => onChange({ ...value, location: e.target.value })}
      />
    </Field>
  </FieldSet>
);
