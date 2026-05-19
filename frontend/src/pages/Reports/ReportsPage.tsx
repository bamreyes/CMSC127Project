import { useState } from "react";
import { FileText, Download, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { api } from "@/lib/api";
import type {
  DriverFilter,
  RegistrationFilter,
  ViolationFilter,
} from "@shared";
import {
  getDriverColumns,
  getVehicleColumns,
  getRegistrationColumns,
  getViolationColumns,
  getViolationTypeCountColumns,
} from "@/components/TableColumns";
import { DataTable } from "@/components/DataTable";
import {
  DriversFilterPanel,
  VehiclesByDriverPanel,
  ExpiredRegistrationsPanel,
  ViolationsByDriverPanel,
  ViolationsByTypePanel,
  ViolationsByLocationPanel,
} from "../../components/ReportFilterPanels";

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

const defaultDriversFilter: DriverFilter = {
  license_number: undefined,
  license_type: undefined,
  license_status: undefined,
  min_age: undefined,
  max_age: undefined,
  sex: undefined,
};

const defaultRegistrationFilter: RegistrationFilter = {
  max_date: undefined,
};

const defaultViolationFilter: ViolationFilter = {
  license_number: undefined,
  year: 0,
  location: undefined,
};

// ----- MAIN PAGE ----------------------------------------------------------------------------------------------------------------------------------------------------
const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>("Drivers by Filter");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [driverFilter, setDriverFilter] = useState<DriverFilter>({
    license_number: undefined,
    license_type: undefined,
    license_status: undefined,
    min_age: undefined,
    max_age: undefined,
    sex: undefined,
  });
  const [registrationFilter, setRegistrationFilter] =
    useState<RegistrationFilter>({
      max_date: undefined,
    });
  const [violationFilter, setViolationFilter] = useState<ViolationFilter>({
    license_number: undefined,
    year: 0,
    location: undefined,
  });

  const handleSelectReport = (r: ReportType) => {
    setReportType(r);
    setRows([]);
    setHasGenerated(false);
  };

  // CHANGE THIS ------------------------------------------------------
  const handleGenerate = async () => {
    let data = [];

    switch (reportType) {
      // DRIVERS BY FILTER
      // ----------------------------------------------------------------------------------------------------
      case "Drivers by Filter": {
        const params = new URLSearchParams();
        setDriverFilter(defaultDriversFilter);
        if (driverFilter.license_type) {
          params.append("license_type", driverFilter.license_type);
        }
        if (driverFilter.license_status) {
          params.append("license_status", driverFilter.license_status);
        }
        if (driverFilter.min_age) {
          params.append("min_age", driverFilter.min_age.toString());
        }
        if (driverFilter.max_age) {
          params.append("max_age", driverFilter.max_age.toString());
        }
        if (driverFilter.sex) {
          params.append("sex", driverFilter.sex);
        }
        const response = await api(`/drivers/filter?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

      case "Vehicles by Driver": {
        const params = new URLSearchParams();
        setDriverFilter(defaultDriversFilter);
        if (driverFilter.license_number) {
          params.append("license_number", driverFilter.license_number);
        }
        const response = await api(`vehicles/filter/driver?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

      case "Expired Vehicle Registrations": {
        const params = new URLSearchParams();
        setRegistrationFilter(defaultRegistrationFilter);
        if (registrationFilter.max_date) {
          params.append("max_date", registrationFilter.max_date as string);
        }
        const response = await api(`registrations/expired?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

      case "Expired or Suspended Licenses": {
        const response = await api(
          `drivers/filter?license_status=Expired,Suspended`,
        );
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data || [];
        }
        break;
      }

      // VIOLATIONS BY DRIVER
      // // ----------------------------------------------------------------------------------------------------
      case "Violations by Driver": {
        const params = new URLSearchParams();
        setViolationFilter(defaultViolationFilter);
        if (violationFilter.license_number) {
          params.append("license_number", violationFilter.license_number);
        }

        const response = await api(`violations/filter/driver?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          console.log(filterRes);
          data = filterRes.data;
        }
        break;
      }
      // // ----------------------------------------------------------------------------------------------------

      // VIOLATIONS BY TYPE
      // ----------------------------------------------------------------------------------------------------
      case "Violations by Type": {
        if (!violationFilter.year) break;

        const response = await api(`violations/count/${violationFilter.year}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

      // ----------------------------------------------------------------------------------------------------

      // VIOLATIONS BY LOC
      // ----------------------------------------------------------------------------------------------------
      case "Violations by Location": {
        const params = new URLSearchParams();
        if (violationFilter.location) {
          params.append("location", violationFilter.location);
        }
        const response = await api(`violations/filter?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }
      // ----------------------------------------------------------------------------------------------------
    }
    setRows(data);
    setHasGenerated(true);
    if (data.length === 0)
      toast.info("No results match the filter."); // when there is no result
    else toast.success("Report generated successfully"); // when there are results
  };

  // handles the csv export button
  const handleExportCSV = () => {};

  // switch functions to det which ui controls to show in the screen
  const renderFilterPanel = () => {
    switch (reportType) {
      case "Drivers by Filter":
        return (
          <DriversFilterPanel value={driverFilter} onChange={setDriverFilter} />
        );
      case "Vehicles by Driver":
        return (
          <VehiclesByDriverPanel
            value={driverFilter}
            onChange={setDriverFilter}
          />
        );
      case "Expired Vehicle Registrations":
        return (
          <ExpiredRegistrationsPanel
            value={registrationFilter}
            onChange={setRegistrationFilter}
          />
        );
      case "Expired or Suspended Licenses":
        return null;
      case "Violations by Driver":
        return (
          <ViolationsByDriverPanel
            value={violationFilter}
            onChange={setViolationFilter}
          />
        );
      case "Violations by Type":
        return (
          <ViolationsByTypePanel
            value={violationFilter}
            onChange={setViolationFilter}
          />
        );
      case "Violations by Location":
        return (
          <ViolationsByLocationPanel
            value={violationFilter}
            onChange={setViolationFilter}
          />
        );
    }
  };

  const getTableConfig = () => {
    if (reportType === "Vehicles by Driver") {
      return {
        columns: getVehicleColumns(undefined as any, undefined as any).filter(
          (c) => c.id !== "actions",
        ),
        title: "Vehicles",
      };
    }
    if (reportType === "Expired Vehicle Registrations") {
      return {
        columns: getRegistrationColumns(
          undefined as any,
          undefined as any,
        ).filter((c) => c.id !== "actions"),
        title: "Vehicle Registrations",
      };
    }
    if (reportType === "Violations by Type") {
      return {
        columns: getViolationTypeCountColumns(),
        title: "Violations by Type",
      };
    }
    if (
      reportType === "Violations by Driver" ||
      reportType === "Violations by Location"
    ) {
      return {
        columns: getViolationColumns(undefined as any, undefined as any).filter(
          (c) => c.id !== "actions",
        ),
        title: "Traffic Violations",
      };
    }
    return {
      columns: getDriverColumns() as any,
      title: "Drivers",
    };
  };

  const { columns, title } = getTableConfig();

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
                      <ChevronDown className="w-4 h-4 text-slate-400" />
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
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
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
        <DataTable columns={columns} data={rows} title={title} />
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
