"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  Driver,
  Vehicle,
  TrafficViolation,
  VehicleRegistration,
  ViolationTypeCount,
} from "@shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDate = (val: any) => {
  if (!val) return "-";
  const date = new Date(val);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

// --- Driver Columns ---
export const getDriverColumns = (
  onDelete?: (id: string) => void,
  onEdit?: (driver: Driver) => void,
): ColumnDef<Driver>[] => [
  {
    accessorKey: "license_number",
    header: "License No.",
  },
  {
    accessorKey: "full_name",
    header: "Full Name",
  },
  {
    accessorKey: "date_of_birth",
    header: "Birthdate",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "sex",
    header: "Sex",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "license_type",
    header: "Type",
  },
  {
    accessorKey: "license_status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = (getValue() as string) || "Active";
      let classes = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      if (status === "Expired") {
        classes = "bg-rose-50 text-rose-700 border-rose-200/60";
      } else if (status === "Suspended") {
        classes = "bg-amber-50 text-amber-700 border-amber-200/60";
      }
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${classes}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "issued_at",
    header: "License Issued",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "expires_at",
    header: "Expiry Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },

  ...(onDelete && onEdit
    ? [
        {
          id: "actions",
          cell: ({ row }: any) => {
            const driver = row.original;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(driver)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(driver.license_number)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ]
    : []),
];

// --- Vehicle Columns ---
export const getVehicleColumns = (
  onDelete: (id: string) => void,
  onEdit: (vehicle: Vehicle) => void,
): ColumnDef<Vehicle>[] => [
  {
    accessorKey: "plate_number",
    header: "Plate No.",
  },
  {
    id: "driver",
    header: "Driver",
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className="flex flex-col">
          {vehicle.owner_name ? (
            <span className="font-medium text-slate-900">
              {vehicle.owner_name}
            </span>
          ) : (
            <span className="font-medium italic text-slate-500">
              Unassigned
            </span>
          )}
          <span className="text-xs text-slate-500">
            {vehicle.license_number || "No License"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "engine_number",
    header: "Engine No.",
  },
  {
    accessorKey: "chassis_number",
    header: "Chassis No.",
  },
  {
    accessorKey: "make",
    header: "Make",
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "vehicle_type",
    header: "Type",
  },
  {
    accessorKey: "color",
    header: "Color",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(vehicle)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(vehicle.plate_number)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- Violation Columns ---
export const getViolationColumns = (
  onDelete: (id: string | number) => void,
  onEdit: (violation: TrafficViolation) => void,
): ColumnDef<TrafficViolation>[] => [
  {
    accessorKey: "violation_id",
    header: "ID",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    id: "violator",
    header: "Violator",
    cell: ({ row }) => {
      const violation = row.original;
      return (
        <div className="flex flex-col">
          {violation.violator_name ? (
            <span className="font-medium text-slate-900">
              {violation.violator_name}
            </span>
          ) : (
            <span className="font-medium italic text-slate-500">
              Unassigned / Unknown
            </span>
          )}
          <span className="text-xs text-slate-500">
            {violation.license_number || "No License"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "plate_number",
    header: "Vehicle (Plate No.)",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "violation_type",
    header: "Violation",
  },
  {
    accessorKey: "fine_amount",
    header: "Fine Amount",
    cell: ({ getValue }) => {
      const amount = getValue() as number;
      const formatted = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount || 0);
      return <div className="font-medium text-red-600">{formatted}</div>;
    },
  },
  {
    accessorKey: "apprehending_officer",
    header: "Officer",
  },
  {
    accessorKey: "violation_status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = (getValue() as string) || "Unpaid";
      let classes = "bg-rose-50 text-rose-700 border-rose-200/60";
      if (status === "Paid") {
        classes = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      }
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${classes}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const violation = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(violation)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(violation.violation_id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- Registration (Transaction) Columns ---
export const getRegistrationColumns = (
  onDelete: (id: string | number) => void,
  onEdit: (registration: VehicleRegistration) => void,
): ColumnDef<VehicleRegistration>[] => [
  {
    accessorKey: "registration_number",
    header: "Reg No.",
  },
  {
    accessorKey: "plate_number",
    header: "Plate No.",
  },
  {
    id: "registered_to",
    header: "Registered To",
    cell: ({ row }) => {
      const reg = row.original;
      return (
        <div className="flex flex-col">
          {reg.owner_name ? (
            <span className="font-medium text-slate-900">{reg.owner_name}</span>
          ) : (
            <span className="font-medium italic text-slate-500">
              Unassigned
            </span>
          )}
          <span className="text-xs text-slate-500">
            {reg.license_number || "No License"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "registration_status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = (getValue() as string) || "Active";
      let classes = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      if (status === "Expired") {
        classes = "bg-rose-50 text-rose-700 border-rose-200/60";
      } else if (status === "Suspended") {
        classes = "bg-amber-50 text-amber-700 border-amber-200/60";
      } else if (status === "Pending") {
        classes = "bg-blue-50 text-blue-700 border-blue-200/60";
      }
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${classes}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "registration_date",
    header: "Reg Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "expiration_date",
    header: "Exp Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const reg = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(reg)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(reg.registration_number)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const getViolationTypeCountColumns =
  (): ColumnDef<ViolationTypeCount>[] => [
    {
      accessorKey: "violation_type",
      header: "Type",
    },
    {
      accessorKey: "count",
      header: "Count",
    },
  ];
