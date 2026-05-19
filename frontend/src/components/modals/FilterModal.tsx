import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import {
  DriverForm,
  defaultDriverFilterData,
} from "@/components/modals/forms/DriverForm";
import type { DriverFilterData } from "@/components/modals/forms/DriverForm";
import { VehicleForm, defaultVehicleFilterData } from "./forms/VehicleForm";
import type { VehicleFilterData } from "./forms/VehicleForm";
import {
  RegistrationForm,
  defaultRegistrationFilterData,
} from "./forms/RegistrationForm";
import type { RegistrationFilterData } from "./forms/RegistrationForm";
import {
  ViolationForm,
  defaultViolationFilterData,
} from "./forms/ViolationForm";
import type { ViolationFilterData } from "./forms/ViolationForm";
import type { Vehicle, VehicleRegistration, TrafficViolation } from "@shared";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Driver } from "@shared";

export function FilterDriverModal({
  isOpen,
  onClose,
  onResults,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResults: (drivers: Driver[]) => void;
  onReset?: () => void;
}) {
  const [filterData, setFilterData] = useState<DriverFilterData>(
    defaultDriverFilterData,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFind = async () => {
    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const r = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${r}`;
    };

    // Build query params from checked boxes and filled fields.
    const params = new URLSearchParams();

    if (filterData.license_number)
      params.set("license_number", filterData.license_number);
    if (filterData.full_name) params.set("full_name", filterData.full_name);
    if (filterData.address) params.set("address", filterData.address);

    // Sex: only send if exactly one is checked (backend takes a single value).
    const sexValues = [filterData.sex_m && "M", filterData.sex_f && "F"].filter(
      Boolean,
    ) as string[];
    if (sexValues.length === 1)
      params.set("sex", sexValues[0] === "M" ? "Male" : "Female");

    // License type: send first checked (or none if multiple/none).
    const typeValues = [
      filterData.license_type_nonpro && "Non-Professional",
      filterData.license_type_pro && "Professional",
      filterData.license_type_student && "Student Permit",
    ].filter(Boolean) as string[];
    if (typeValues.length === 1) params.set("license_type", typeValues[0]);

    // License status: send first checked.
    const statusValues = [
      filterData.license_status_valid && "Valid",
      filterData.license_status_expired && "Expired",
      filterData.license_status_suspended && "Suspended",
      filterData.license_status_revoked && "Revoked",
    ].filter(Boolean) as string[];
    if (statusValues.length === 1)
      params.set("license_status", statusValues[0]);

    if (filterData.date_of_birth_min)
      params.set("min_bdate", toDateString(filterData.date_of_birth_min));
    if (filterData.date_of_birth_max)
      params.set("max_bdate", toDateString(filterData.date_of_birth_max));

    setSubmitting(true);
    try {
      const response = await api(`/drivers/filter?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Filter failed.");
      }

      onResults(result.data || []);
      onClose();
    } catch (error) {
      toast.error("Failed to filter drivers.", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Find a Driver"
      description="Filter out the details of a driver (or more) to find."
    >
      <DriverForm
        mode="search"
        filterData={filterData}
        onFilterChange={setFilterData}
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button
          className="rounded-lg"
          variant="outline"
          type="button"
          onClick={() => {
            setFilterData(defaultDriverFilterData);
            onReset?.();
            onClose();
          }}
        >
          Reset
        </Button>
        <Button
          className="rounded-lg"
          onClick={handleFind}
          disabled={submitting}
        >
          {submitting ? "Searching..." : "Find"}
        </Button>
      </div>
    </BaseModal>
  );
}

export function FilterVehicleModal({
  isOpen,
  onClose,
  onResults,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResults: (vehicles: Vehicle[]) => void;
  onReset?: () => void;
}) {
  const [filterData, setFilterData] = useState<VehicleFilterData>(
    defaultVehicleFilterData,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFind = async () => {
    const params = new URLSearchParams();

    if (filterData.plate_number)
      params.set("plate_number", filterData.plate_number);
    if (filterData.license_number)
      params.set("license_number", filterData.license_number);
    if (filterData.engine_number)
      params.set("engine_number", filterData.engine_number);
    if (filterData.chassis_number)
      params.set("chassis_number", filterData.chassis_number);
    if (filterData.make) params.set("make", filterData.make);
    if (filterData.model) params.set("model", filterData.model);
    if (filterData.color) params.set("color", filterData.color);
    if (filterData.min_year !== "")
      params.set("min_year", String(filterData.min_year));
    if (filterData.max_year !== "")
      params.set("max_year", String(filterData.max_year));

    const typeValues = [
      filterData.vehicle_type_private && "Private Car",
      filterData.vehicle_type_puv && "Public Utility Vehicle",
      filterData.vehicle_type_motor && "Motorcycle",
    ].filter(Boolean) as string[];
    if (typeValues.length === 1) params.set("vehicle_type", typeValues[0]);

    setSubmitting(true);
    try {
      const [filterRes, drvRes] = await Promise.all([
        api(`/vehicles/filter/driver?${params.toString()}`),
        api("/drivers"),
      ]);

      const result = await filterRes.json();
      if (!filterRes.ok) throw new Error(result.message || "Filter failed.");

      const drivers = drvRes.ok ? (await drvRes.json()).data || [] : [];

      const mapped = (result.data || []).map((v: any) => ({
        ...v,
        owner_name: drivers.find(
          (d: any) =>
            d.license_number?.toUpperCase() === v.license_number?.toUpperCase(),
        )?.full_name,
      }));

      onResults(mapped);
      onClose();
    } catch (error) {
      toast.error("Failed to filter vehicles.", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Find a Vehicle"
      description="Filter out the details of a vehicle (or more) to find."
    >
      <VehicleForm
        mode="search"
        filterData={filterData}
        onFilterChange={setFilterData}
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button
          className="rounded-lg"
          variant="outline"
          type="button"
          onClick={() => {
            setFilterData(defaultVehicleFilterData);
            onReset?.();
            onClose();
          }}
        >
          Reset
        </Button>
        <Button
          className="rounded-lg"
          onClick={handleFind}
          disabled={submitting}
        >
          {submitting ? "Searching..." : "Find"}
        </Button>
      </div>
    </BaseModal>
  );
}

export function FilterRegistrationModal({
  isOpen,
  onClose,
  onResults,
  allRegistrations,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResults: (registrations: VehicleRegistration[]) => void;
  allRegistrations: VehicleRegistration[];
  onReset?: () => void;
}) {
  const [filterData, setFilterData] = useState<RegistrationFilterData>(
    defaultRegistrationFilterData,
  );

  const handleFind = () => {
    let results = [...allRegistrations];

    if (filterData.registration_number !== "") {
      results = results.filter(
        (r) => r.registration_number === filterData.registration_number,
      );
    }
    if (filterData.plate_number) {
      results = results.filter((r) =>
        r.plate_number
          .toLowerCase()
          .includes(filterData.plate_number.toLowerCase()),
      );
    }

    const checkedStatuses = [
      filterData.registration_status_active && "Active",
      filterData.registration_status_expired && "Expired",
      filterData.registration_status_suspended && "Suspended",
    ].filter(Boolean) as string[];
    if (checkedStatuses.length > 0) {
      results = results.filter((r) =>
        checkedStatuses.includes(r.registration_status),
      );
    }

    const toDay = (d: Date | string) => new Date(new Date(d).toDateString());

    if (filterData.registration_date_min) {
      results = results.filter(
        (r) =>
          toDay(r.registration_date) >=
          toDay(filterData.registration_date_min!),
      );
    }
    if (filterData.registration_date_max) {
      results = results.filter(
        (r) =>
          toDay(r.registration_date) <=
          toDay(filterData.registration_date_max!),
      );
    }
    if (filterData.expiration_date_min) {
      results = results.filter(
        (r) =>
          toDay(r.expiration_date) >= toDay(filterData.expiration_date_min!),
      );
    }
    if (filterData.expiration_date_max) {
      results = results.filter(
        (r) =>
          toDay(r.expiration_date) <= toDay(filterData.expiration_date_max!),
      );
    }

    onResults(results);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Find a Registration"
      description="Filter out the details of a registration (or more) to find."
    >
      <RegistrationForm
        mode="search"
        filterData={filterData}
        onFilterChange={setFilterData}
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button
          className="rounded-lg"
          variant="outline"
          type="button"
          onClick={() => {
            setFilterData(defaultRegistrationFilterData);
            onReset?.();
            onClose();
          }}
        >
          Reset
        </Button>
        <Button className="rounded-lg" onClick={handleFind}>
          Find
        </Button>
      </div>
    </BaseModal>
  );
}

export function FilterViolationModal({
  isOpen,
  onClose,
  onResults,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResults: (violations: TrafficViolation[]) => void;
  onReset?: () => void;
}) {
  const [filterData, setFilterData] = useState<ViolationFilterData>(
    defaultViolationFilterData,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFind = async () => {
    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const r = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${r}`;
    };
    const params = new URLSearchParams();

    if (filterData.location) params.set("location", filterData.location);
    if (filterData.violation_type)
      params.set("violation_type", filterData.violation_type);
    if (filterData.apprehending_officer)
      params.set("apprehending_officer", filterData.apprehending_officer);
    if (filterData.min_fine_amount !== "")
      params.set("min_fine_amount", String(filterData.min_fine_amount));
    if (filterData.max_fine_amount !== "")
      params.set("max_fine_amount", String(filterData.max_fine_amount));
    if (filterData.date_min)
      params.set("min_date", toDateString(filterData.date_min));
    if (filterData.date_max)
      params.set("max_date", toDateString(filterData.date_max));
    if (filterData.plate_number)
      params.set("plate_number", filterData.plate_number);
    if (filterData.license_number)
      params.set("license_number", filterData.license_number);

    const statusValues = [
      filterData.violation_status_unpaid && "Unpaid",
      filterData.violation_status_paid && "Paid",
      filterData.violation_status_contested && "Contested",
    ].filter(Boolean) as string[];
    if (statusValues.length === 1)
      params.set("violation_status", statusValues[0]);

    setSubmitting(true);
    try {
      const [filterRes, drvRes] = await Promise.all([
        api(`/violations/filter?${params.toString()}`),
        api("/drivers"),
      ]);

      const result = await filterRes.json();
      if (!filterRes.ok) throw new Error(result.message || "Filter failed.");

      const drivers = drvRes.ok ? (await drvRes.json()).data || [] : [];

      const mapped = (result.data || []).map((v: any) => ({
        ...v,
        violator_name: drivers.find(
          (d: any) =>
            d.license_number?.toUpperCase() === v.license_number?.toUpperCase(),
        )?.full_name,
      }));

      onResults(mapped);
      onClose();
    } catch (error) {
      toast.error("Failed to filter violations.", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Find a Violation"
      description="Filter out the details of a violation (or more) to find."
    >
      <ViolationForm
        mode="search"
        filterData={filterData}
        onFilterChange={setFilterData}
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button
          className="rounded-lg"
          variant="outline"
          type="button"
          onClick={() => {
            setFilterData(defaultViolationFilterData);
            onReset?.();
            onClose();
          }}
        >
          Reset
        </Button>
        <Button
          className="rounded-lg"
          onClick={handleFind}
          disabled={submitting}
        >
          {submitting ? "Searching..." : "Find"}
        </Button>
      </div>
    </BaseModal>
  );
}
