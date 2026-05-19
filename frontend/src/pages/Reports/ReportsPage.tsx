import { useState } from "react";
import { FileText, Download, Filter, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import BaseModal from "@/components/modals/BaseModal";
import {
  DriversFilterPanel,
  VehiclesByDriverPanel,
  ExpiredRegistrationsPanel,
  ViolationsByDriverPanel,
  ViolationsByTypePanel,
  ViolationsByLocationPanel,
} from "../../components/ReportFilterPanels";

// ----- REPORT TYPE -----
type ReportType =
  | "Drivers by Filter"
  | "Vehicles by Driver"
  | "Expired Vehicle Registrations"
  | "Expired or Suspended Licenses"
  | "Violations by Driver"
  | "Violations by Type"
  | "Violations by Location";

const REPORT_TYPES: ReportType[] = [
  "Drivers by Filter",
  "Vehicles by Driver",
  "Expired Vehicle Registrations",
  "Expired or Suspended Licenses",
  "Violations by Driver",
  "Violations by Type",
  "Violations by Location",
];

// Reports that do NOT need a filter modal
const NO_FILTER_REPORTS: ReportType[] = ["Expired or Suspended Licenses"];

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

// ----- MAIN PAGE -----
const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>("Drivers by Filter");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [driverFilter, setDriverFilter] =
    useState<DriverFilter>(defaultDriversFilter);
  const [registrationFilter, setRegistrationFilter] =
    useState<RegistrationFilter>(defaultRegistrationFilter);
  const [violationFilter, setViolationFilter] = useState<ViolationFilter>(
    defaultViolationFilter,
  );

  const handleSelectReport = (r: ReportType) => {
    setReportType(r);
    setRows([]);
    setHasGenerated(false);
    // Reset all filters
    setDriverFilter(defaultDriversFilter);
    setRegistrationFilter(defaultRegistrationFilter);
    setViolationFilter(defaultViolationFilter);
  };

  const needsFilter = !NO_FILTER_REPORTS.includes(reportType);

  // ----- GENERATE -----
  const handleGenerate = async () => {
    let data = [];

    switch (reportType) {
      case "Drivers by Filter": {
        const params = new URLSearchParams();
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

      case "Violations by Driver": {
        const params = new URLSearchParams();
        if (violationFilter.license_number) {
          params.append("license_number", violationFilter.license_number);
        }
        const response = await api(`violations/filter/driver?${params}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

      case "Violations by Type": {
        if (!violationFilter.year) break;
        const response = await api(`violations/count/${violationFilter.year}`);
        if (response.ok) {
          const filterRes = await response.json();
          data = filterRes.data;
        }
        break;
      }

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
    }
    setRows(data);
    setHasGenerated(true);
    if (data.length === 0) toast.info("No results match the filter.");
    else toast.success("Report generated successfully");
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.info("No data to export. Generate a report first.");
      return;
    }

    const { columns: cols } = getTableConfig();

    // Build headers and accessor keys from column definitions
    const headers: string[] = [];
    const accessors: ((row: Record<string, any>) => string)[] = [];

    for (const col of cols) {
      // Skip action columns
      if ((col as any).id === "actions") continue;

      const header =
        typeof (col as any).header === "string"
          ? (col as any).header
          : ((col as any).accessorKey ?? (col as any).id ?? "");
      headers.push(String(header));

      const key = (col as any).accessorKey;
      if (key) {
        accessors.push((row) => {
          const val = row[key];
          if (val === null || val === undefined) return "";
          if (val instanceof Date) return val.toLocaleDateString();
          return String(val);
        });
      } else {
        accessors.push(() => "");
      }
    }

    // Escape a CSV cell value
    const escapeCSV = (val: string): string => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines: string[] = [];
    csvLines.push(headers.map(escapeCSV).join(","));

    for (const row of rows) {
      const cells = accessors.map((fn) => escapeCSV(fn(row)));
      csvLines.push(cells.join(","));
    }

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const slug = reportType.toLowerCase().replace(/\s+/g, "_");
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${slug}_${timestamp}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully.");
  };

  // ----- FILTER MODAL CONTENT -----
  const renderFilterModalContent = () => {
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
      default:
        return null;
    }
  };

  // ----- FILTER MODAL TITLE -----
  const getFilterModalTitle = (): string => {
    switch (reportType) {
      case "Drivers by Filter":
        return "Filter Drivers";
      case "Vehicles by Driver":
        return "Filter by Driver";
      case "Expired Vehicle Registrations":
        return "Filter Expired Registrations";
      case "Violations by Driver":
        return "Filter Violations by Driver";
      case "Violations by Type":
        return "Filter Violations by Type";
      case "Violations by Location":
        return "Filter Violations by Location";
      default:
        return "Filter Parameters";
    }
  };

  // ----- TABLE CONFIG -----
  const getTableConfig = () => {
    if (reportType === "Vehicles by Driver") {
      return {
        columns: getVehicleColumns(undefined as any, undefined as any).filter(
          (c) => c.id !== "actions",
        ),
      };
    }
    if (reportType === "Expired Vehicle Registrations") {
      return {
        columns: getRegistrationColumns(
          undefined as any,
          undefined as any,
        ).filter((c) => c.id !== "actions"),
      };
    }
    if (reportType === "Violations by Type") {
      return {
        columns: getViolationTypeCountColumns(),
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
      };
    }
    return {
      columns: getDriverColumns() as any,
    };
  };

  const { columns } = getTableConfig();

  // ----- RENDER -----
  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Toolbar row: Dropdown title on the left, filter + action buttons on the right */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-1 py-0 h-auto text-2xl font-bold tracking-tight text-slate-900 hover:bg-transparent hover:text-slate-700 cursor-pointer"
              >
                <span>{reportType}</span>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72 max-h-80 overflow-y-auto"
              align="start"
            >
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
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {needsFilter && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg bg-white text-slate-700 transition-all"
              onClick={() => setFilterModalOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            className="cursor-pointer gap-2 rounded-lg"
          >
            <FileText size={15} />
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="cursor-pointer gap-2 rounded-lg"
          >
            <Download size={15} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 -mt-3 italic">
        {REPORT_DESCRIPTIONS[reportType]}
      </p>

      {/* Results table */}
      {rows.length > 0 && <DataTable columns={columns} data={rows} />}

      {/* Empty state */}
      {!hasGenerated && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300" />
          <p className="text-[13px] text-slate-400 mt-3">
            Select a report type and click{" "}
            <strong className="text-slate-600">Generate</strong> to view
            results.
          </p>
        </div>
      )}

      {/* Empty results state */}
      {hasGenerated && rows.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300" />
          <p className="text-[13px] text-slate-400 mt-3">
            No results found matching the current filter.
          </p>
        </div>
      )}

      {/* Filter Modal */}
      {needsFilter && (
        <BaseModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          title={getFilterModalTitle()}
          description={REPORT_DESCRIPTIONS[reportType]}
        >
          {renderFilterModalContent()}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              className="rounded-lg"
              variant="outline"
              type="button"
              onClick={() => {
                // Reset the appropriate filter
                switch (reportType) {
                  case "Drivers by Filter":
                  case "Vehicles by Driver":
                    setDriverFilter(defaultDriversFilter);
                    break;
                  case "Expired Vehicle Registrations":
                    setRegistrationFilter(defaultRegistrationFilter);
                    break;
                  default:
                    setViolationFilter(defaultViolationFilter);
                    break;
                }
              }}
            >
              Reset
            </Button>
            <Button
              className="rounded-lg"
              onClick={() => {
                setFilterModalOpen(false);
                handleGenerate();
              }}
            >
              Apply & Generate
            </Button>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default ReportsPage;
