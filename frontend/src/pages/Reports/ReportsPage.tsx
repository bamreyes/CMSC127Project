import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

// ----- REPORT TYPE ----------------------------------------------------------------------------------------------------------------------------------------------------
// restricts reportType to only these values
type ReportType =
  | "Drivers by Filter"
  | "Vehicles by Driver"
  | "Expired Vehicle Registrations"
  | "Expired or Suspended Licenses"
  | "Violations by Driver"
  | "Violations by Type"
  | "Violations by Location";
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- DROPDOWN VAL ----------------------------------------------------------------------------------------------------------------------------------------------------
// list of values in the dropdown
const REPORT_TYPES: ReportType[] = [
  "Drivers by Filter",
  "Vehicles by Driver",
  "Expired Vehicle Registrations",
  "Expired or Suspended Licenses",
  "Violations by Driver",
  "Violations by Type",
  "Violations by Location",
];
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- REPORT DESC PER FILTER ----------------------------------------------------------------------------------------------------------------------------------------------------
// descriptions per report
const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  "Drivers by Filter":
    "Filter and view drivers by license type, status, age range, and sex",
  "Vehicles by Driver": "View all vehicles registered under a specific driver",
  "Expired Vehicle Registrations":
    "View all vehicle registrations that have expired as of a given date",
  "Expired or Suspended Licenses":
    "View all driver licenses that are expired or suspended as of a given date",
  "Violations by Driver":
    "View all traffic violations committed by a given driver within a specified date range",
  "Violations by Type":
    "View all traffic violations filtered by violation type",
  "Violations by Location": "View all traffic violations filtered by location",
};
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- TABLE COL ----------------------------------------------------------------------------------------------------------------------------------------------------
// columns per filter category
// CHANGE TO MATCH THE TABLE IN SQL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const COLUMNS: Record<ReportType, string[]> = {
  "Drivers by Filter": [
    "License Number",
    "Full Name",
    "License Type",
    "Status",
    "Age",
    "Sex",
  ],
  "Vehicles by Driver": [
    "Plate Number",
    "Make",
    "Model",
    "Year",
    "Vehicle Type",
    "Owner",
  ],
  "Expired Vehicle Registrations": [
    "Plate Number",
    "Owner Name",
    "Expiration Date",
    "Vehicle Type",
  ],
  "Expired or Suspended Licenses": [
    "License Number",
    "Full Name",
    "License Type",
    "Status",
    "Expiry Date",
  ],
  "Violations by Driver": [
    "Violation Type",
    "Date",
    "Location",
    "Fine Amount",
    "Status",
  ],
  "Violations by Type": ["Violation Type", "Count", "Total Fines"],
  "Violations by Location": [
    "Location",
    "Violation Type",
    "Driver Name",
    "Date",
    "Fine Amount",
    "Status",
  ],
};
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- MOCK DATA ----------------------------------------------------------------------------------------------------------------------------------------------------
// remove everything after connecting the back end !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// generated lang ^__^ but can be filtered na in the website
const MOCK_DATA: Record<ReportType, Record<string, any>[]> = {
  "Drivers by Filter": [
    {
      "License Number": "N01-85-123456",
      "Full Name": "Juan Dela Cruz",
      "License Type": "Non-Professional",
      Status: "Valid",
      Age: 34,
      Sex: "Male",
    },
    {
      "License Number": "P02-90-789012",
      "Full Name": "Maria Santos",
      "License Type": "Professional",
      Status: "Valid",
      Age: 39,
      Sex: "Female",
    },
    {
      "License Number": "N03-78-345678",
      "Full Name": "Roberto Reyes",
      "License Type": "Non-Professional",
      Status: "Expired",
      Age: 52,
      Sex: "Male",
    },
    {
      "License Number": "P04-95-901234",
      "Full Name": "Ana Martinez",
      "License Type": "Professional",
      Status: "Valid",
      Age: 28,
      Sex: "Female",
    },
  ],
  "Vehicles by Driver": [
    {
      "Plate Number": "ABC 1234",
      Make: "Toyota",
      Model: "Vios",
      Year: 2021,
      "Vehicle Type": "Private Car",
      Owner: "Juan Dela Cruz",
    },
    {
      "Plate Number": "XYZ 5678",
      Make: "Honda",
      Model: "Click 125",
      Year: 2020,
      "Vehicle Type": "Motorcycle",
      Owner: "Juan Dela Cruz",
    },
    {
      "Plate Number": "DEF 9012",
      Make: "Mitsubishi",
      Model: "L300",
      Year: 2019,
      "Vehicle Type": "Utility Vehicle",
      Owner: "Maria Santos",
    },
  ],
  "Expired Vehicle Registrations": [
    {
      "Plate Number": "ABC 1234",
      "Owner Name": "Juan Dela Cruz",
      "Expiration Date": "2024-03-15",
      "Vehicle Type": "Private Car",
    },
    {
      "Plate Number": "JKL 7890",
      "Owner Name": "Ana Martinez",
      "Expiration Date": "2024-01-10",
      "Vehicle Type": "Motorcycle",
    },
    {
      "Plate Number": "MNO 2345",
      "Owner Name": "Pedro Lopez",
      "Expiration Date": "2023-12-01",
      "Vehicle Type": "Utility Vehicle",
    },
  ],
  "Expired or Suspended Licenses": [
    {
      "License Number": "N03-78-345678",
      "Full Name": "Roberto Reyes",
      "License Type": "Non-Professional",
      Status: "Expired",
      "Expiry Date": "2023-08-22",
    },
    {
      "License Number": "P06-88-112233",
      "Full Name": "Lito Fernandez",
      "License Type": "Professional",
      Status: "Suspended",
      "Expiry Date": "2024-02-14",
    },
    {
      "License Number": "N07-80-445566",
      "Full Name": "Nena Cruz",
      "License Type": "Non-Professional",
      Status: "Expired",
      "Expiry Date": "2023-05-30",
    },
  ],
  "Violations by Driver": [
    {
      "Violation Type": "Overspeeding",
      Date: "2024-04-15",
      Location: "EDSA, Quezon City",
      "Fine Amount": 1500,
      Status: "Unpaid",
    },
    {
      "Violation Type": "Illegal Parking",
      Date: "2024-02-10",
      Location: "BGC, Taguig",
      "Fine Amount": 500,
      Status: "Paid",
    },
    {
      "Violation Type": "Beating Red Light",
      Date: "2024-01-05",
      Location: "C5, Pasig",
      "Fine Amount": 1000,
      Status: "Unpaid",
    },
  ],
  "Violations by Type": [
    { "Violation Type": "Overspeeding", Count: 145, "Total Fines": 217500 },
    { "Violation Type": "Reckless Driving", Count: 87, "Total Fines": 261000 },
    { "Violation Type": "No Helmet", Count: 203, "Total Fines": 203000 },
    { "Violation Type": "Illegal Parking", Count: 64, "Total Fines": 32000 },
    { "Violation Type": "Beating Red Light", Count: 51, "Total Fines": 51000 },
  ],
  "Violations by Location": [
    {
      Location: "EDSA, Quezon City",
      "Violation Type": "Overspeeding",
      "Driver Name": "Juan Dela Cruz",
      Date: "2024-04-15",
      "Fine Amount": 1500,
      Status: "Unpaid",
    },
    {
      Location: "EDSA, Quezon City",
      "Violation Type": "Illegal Parking",
      "Driver Name": "Rosa Garcia",
      Date: "2024-03-10",
      "Fine Amount": 500,
      Status: "Paid",
    },
    {
      Location: "BGC, Taguig",
      "Violation Type": "Illegal Parking",
      "Driver Name": "Maria Santos",
      Date: "2024-02-10",
      "Fine Amount": 500,
      Status: "Paid",
    },
    {
      Location: "C5, Pasig",
      "Violation Type": "Beating Red Light",
      "Driver Name": "Ana Martinez",
      Date: "2024-01-05",
      "Fine Amount": 1000,
      Status: "Unpaid",
    },
  ],
};

// ----- EXPORT TO CSV ----------------------------------------------------------------------------------------------------------------------------------------------------
// joins all columns to export sa csv
// helper func!
const toCSV = (columns: string[], rows: Record<string, any>[]): string => {
  const header = columns.join(",");
  const body = rows
    .map((r) => columns.map((c) => `"${r[c] ?? ""}"`).join(","))
    .join("\n");
  return `${header}\n${body}`;
};
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- DL CSV ----------------------------------------------------------------------------------------------------------------------------------------------------
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ----- STATUS ----------------------------------------------------------------------------------------------------------------------------------------------------
// CHECK IF VALUES MATCH W/ THE BACKEND TABLE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const getStatusClass = (value: string): string => {
  if (value === "Paid" || value === "Valid")
    return "bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-[11px] font-medium inline-block";
  if (value === "Unpaid" || value === "Expired")
    return "bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 text-[11px] font-medium inline-block";
  if (value === "Suspended")
    return "bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-[11px] font-medium inline-block";
  return "bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 text-[11px] font-medium inline-block";
};
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

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

// ----- FILTER STATE INTERFACE ----------------------------------------------------------------------------------------------------------------------------------------------------
// DOUBLE CHEKC VALUES 1!!!!!!!!!!!!!!!!!!!!!!!!
interface DriversFilter {
  license_type: string;
  license_status: string;
  min_age: string;
  max_age: string;
  sex: string;
}
interface DateRangeFilter {
  extra_value: string;
  start_date: string;
  end_date: string;
}

// driver -------------------------------------------------------------
const DriversFilterPanel = ({
  value,
  onChange,
}: {
  value: DriversFilter;
  onChange: (v: DriversFilter) => void;
}) => (
  <FieldGroup className="gap-y-4">
    <FieldSet className="gap-y-1.5">
      <FieldLabel>License Type</FieldLabel>
      <Field>
        <SelectField
          value={value.license_type}
          onChange={(v) => onChange({ ...value, license_type: v })}
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
          value={value.license_status}
          onChange={(v) => onChange({ ...value, license_status: v })}
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
            value={value.min_age}
            onChange={(e) => onChange({ ...value, min_age: e.target.value })}
          />
        </Field>
        <Field className="flex-1">
          <Input
            type="number"
            placeholder="Max age"
            value={value.max_age}
            onChange={(e) => onChange({ ...value, max_age: e.target.value })}
          />
        </Field>
      </div>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>Sex</FieldLabel>
      <Field>
        <SelectField
          value={value.sex}
          onChange={(v) => onChange({ ...value, sex: v })}
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

// for date only filters ----------------------------------------------------
const DateOnlyPanel = ({
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

// for date range / start and end -----------------------------------------------------------
const DateRangePanel = ({
  extraLabel,
  value,
  onChange,
}: {
  extraLabel: string;
  value: DateRangeFilter;
  onChange: (v: DateRangeFilter) => void;
}) => (
  <FieldGroup className="gap-y-4">
    <FieldSet className="gap-y-1.5">
      <FieldLabel>{extraLabel}</FieldLabel>
      <Field>
        <Input
          placeholder={`Enter ${extraLabel.toLowerCase()}`}
          value={value.extra_value}
          onChange={(e) => onChange({ ...value, extra_value: e.target.value })}
        />
      </Field>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>Start Date</FieldLabel>
      <Field>
        <Input
          type="date"
          value={value.start_date}
          onChange={(e) => onChange({ ...value, start_date: e.target.value })}
        />
      </Field>
    </FieldSet>
    <FieldSet className="gap-y-1.5">
      <FieldLabel>End Date</FieldLabel>
      <Field>
        <Input
          type="date"
          value={value.end_date}
          onChange={(e) => onChange({ ...value, end_date: e.target.value })}
        />
      </Field>
    </FieldSet>
  </FieldGroup>
);

// ----- MAIN PAGE ----------------------------------------------------------------------------------------------------------------------------------------------------
const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>("Drivers by Filter");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [driversFilter, setDriversFilter] = useState<DriversFilter>({
    license_type: "",
    license_status: "",
    min_age: "",
    max_age: "",
    sex: "",
  });
  const [asOfDate, setAsOfDate] = useState("");
  const [vehicleDriver, setVehicleDriver] = useState("");
  const [violByDriver, setViolByDriver] = useState<DateRangeFilter>({
    extra_value: "",
    start_date: "",
    end_date: "",
  });
  const [violByType, setViolByType] = useState<DateRangeFilter>({
    extra_value: "",
    start_date: "",
    end_date: "",
  });
  const [violByLoc, setViolByLoc] = useState<DateRangeFilter>({
    extra_value: "",
    start_date: "",
    end_date: "",
  });

  const handleSelectReport = (r: ReportType) => {
    setReportType(r);
    setRows([]);
    setHasGenerated(false);
  };

  // CHANGE THIS ------------------------------------------------------
  const handleGenerate = () => {
    let data = MOCK_DATA[reportType];

    switch (reportType) {
      // DRIVERS BY FILTER
      // ----------------------------------------------------------------------------------------------------
      case "Drivers by Filter":
        break;
      // ----------------------------------------------------------------------------------------------------

      // VEHICLES BY DRIVER
      // ----------------------------------------------------------------------------------------------------
      case "Vehicles by Driver":
        break;
      // ----------------------------------------------------------------------------------------------------

      // VIOLATIONS BY DRIVER
      // // ----------------------------------------------------------------------------------------------------
      case "Violations by Driver":
        break;
      // // ----------------------------------------------------------------------------------------------------

      // VIOLATIONS BY TYPE
      // ----------------------------------------------------------------------------------------------------
      case "Violations by Type":
        break;
      // ----------------------------------------------------------------------------------------------------

      // VIOLATIONS BY LOC
      // ----------------------------------------------------------------------------------------------------
      case "Violations by Location":
        break;
      // ----------------------------------------------------------------------------------------------------
    }
    setRows(data);
    setHasGenerated(true);
    if (data.length === 0)
      toast.info("No results match the filter."); // when there is no result
    else toast.success("Report generated successfully"); // when there are results
  };

  // handles the csv export button
  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.info("No data to export.");
      return;
    }
    downloadCSV(
      toCSV(COLUMNS[reportType], rows),
      `${reportType.replace(/\s+/g, "_")}_report.csv`,
    );
    toast.success("CSV exported");
  };

  // switch functions to det which ui controls to show in the screen
  const renderFilterPanel = () => {
    switch (reportType) {
      // -----------------------------------------
      case "Drivers by Filter":
        return (
          <DriversFilterPanel
            value={driversFilter}
            onChange={setDriversFilter}
          />
        );
      // -----------------------------------------
      // -----------------------------------------
      case "Vehicles by Driver":
        return (
          <FieldSet className="gap-y-1.5">
            <FieldLabel>Driver Name</FieldLabel>
            <Field>
              <Input
                placeholder="Enter driver name"
                value={vehicleDriver}
                onChange={(e) => setVehicleDriver(e.target.value)}
              />
            </Field>
          </FieldSet>
        );
      // -----------------------------------------
      // -----------------------------------------
      case "Expired Vehicle Registrations":
      // -----------------------------------------
      // -----------------------------------------
      case "Expired or Suspended Licenses":
        return <DateOnlyPanel value={asOfDate} onChange={setAsOfDate} />;
      // -----------------------------------------
      // -----------------------------------------
      case "Violations by Driver":
        return (
          <DateRangePanel
            extraLabel="Driver Name"
            value={violByDriver}
            onChange={setViolByDriver}
          />
        );
      // -----------------------------------------
      // -----------------------------------------
      case "Violations by Type":
        return (
          <FieldSet className="gap-y-1.5">
            <FieldLabel>Year</FieldLabel>
            <Field>
              <Input
                type="number"
                placeholder="e.g. 2024"
                value={violByType.start_date}
                onChange={(e) =>
                  setViolByType((p) => ({ ...p, start_date: e.target.value }))
                }
              />
            </Field>
          </FieldSet>
        );
      // -----------------------------------------
      // -----------------------------------------
      case "Violations by Location":
        return (
          <FieldSet className="gap-y-1.5">
            <FieldLabel>City / Region</FieldLabel>
            <Field>
              <Input
                placeholder="Enter city or region"
                value={violByLoc.extra_value}
                onChange={(e) =>
                  setViolByLoc((p) => ({ ...p, extra_value: e.target.value }))
                }
              />
            </Field>
          </FieldSet>
        );
      // -----------------------------------------
    }
  };

  // get headers based on the selected filter
  const columns = COLUMNS[reportType];

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* top panels */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
        {/* select report */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-[15px] font-semibold text-slate-800 m-0">
            Select Report
          </p>
          <p className="text-[13px] text-slate-500 mt-0.5 mb-0">
            Choose a report type to generate
          </p>

          <div className="mt-4">
            <FieldSet className="gap-y-1.5">
              <FieldLabel>Report Type</FieldLabel>
              <Field>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between border border-slate-200 rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-800 cursor-pointer font-normal h-9 hover:bg-slate-100"
                    >
                      <span>{reportType}</span>
                      <svg
                        className="w-4 h-4 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-80 overflow-y-auto">
                    {REPORT_TYPES.map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => handleSelectReport(r)}
                        className={`cursor-pointer justify-between text-[13px] ${
                          r === reportType
                            ? "text-indigo-600 font-semibold bg-indigo-50/50"
                            : "text-slate-700"
                        }`}
                      >
                        <span>{r}</span>
                        {r === reportType && (
                          <svg
                            className="w-3.5 h-3.5 text-indigo-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
            </FieldSet>

            <p className="text-[13px] text-slate-500 mt-3 italic">
              {REPORT_DESCRIPTIONS[reportType]}
            </p>
          </div>
        </div>

        {/* filter parameters */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-[15px] font-semibold text-slate-800 m-0">
            Filter Parameters
          </p>
          <p className="text-[13px] text-slate-500 mt-0.5 mb-0">
            Specify filter criteria for the report
          </p>
          <div className="mt-4">{renderFilterPanel()}</div>
        </div>
      </div>

      {/* action buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} className="cursor-pointer gap-2">
          <FileText size={15} />
          Generate Report
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="cursor-pointer gap-2"
        >
          <Download size={15} />
          Export to CSV
        </Button>
      </div>

      {/* results table */}
      {rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col} className="px-4 py-2.5 text-slate-700">
                      {col === "Status" ? (
                        <span
                          className={getStatusClass(String(row[col] ?? ""))}
                        >
                          {row[col]}
                        </span>
                      ) : (
                        (row[col] ?? "—")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-400">
            {rows.length} record{rows.length !== 1 ? "s" : ""} found
          </div>
        </div>
      )}

      {/* empty state */}
      {!hasGenerated && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300" />
          <p className="text-[13px] text-slate-400 mt-3">
            Select a report type and click{" "}
            <strong className="text-slate-600">Generate Report</strong> to view
            results.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
