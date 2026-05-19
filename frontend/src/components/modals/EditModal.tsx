import React, { useState, useEffect } from "react";
import BaseModal from "@/components/modals/BaseModal";
import { DriverForm } from "@/components/modals/forms/DriverForm";
import type { DriverFormData } from "@/components/modals/forms/DriverForm";
import { VehicleForm } from "./forms/VehicleForm";
import type { VehicleFormData } from "./forms/VehicleForm";
import { RegistrationForm } from "./forms/RegistrationForm";
import type { RegistrationFormData } from "./forms/RegistrationForm";
import { ViolationForm } from "./forms/ViolationForm";
import type { ViolationFormData } from "./forms/ViolationForm";
import type { Vehicle, VehicleRegistration, TrafficViolation } from "@shared";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Driver } from "@shared";
import {
  driverSchema,
  vehicleSchema,
  registrationSchema,
  violationSchema,
} from "@/lib/validation";

const toDate = (val: string | Date | undefined) =>
  val ? new Date(val) : undefined;

const toDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
};

export function EditDriverModal({
  isOpen,
  onClose,
  onSuccess,
  driver,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver: Driver;
}) {
  const mapSexToCode = (s: string): "M" | "F" => {
    if (s === "Male") return "M";
    if (s === "Female") return "F";
    return s as "M" | "F";
  };

  const [formData, setFormData] = useState<DriverFormData>({
    license_number: driver.license_number,
    full_name: driver.full_name,
    date_of_birth: toDate(driver.date_of_birth),
    sex: mapSexToCode(driver.sex),
    address: driver.address,
    license_type: driver.license_type,
    license_status: driver.license_status,
    issued_at: toDate(driver.issued_at),
    expires_at: toDate(driver.expires_at),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-sync if a different row's edit is opened or modal is dismissed.
  useEffect(() => {
    setFormData({
      license_number: driver.license_number,
      full_name: driver.full_name,
      date_of_birth: toDate(driver.date_of_birth),
      sex: mapSexToCode(driver.sex),
      address: driver.address,
      license_type: driver.license_type,
      license_status: driver.license_status,
      issued_at: toDate(driver.issued_at),
      expires_at: toDate(driver.expires_at),
    });
    setErrors({});
  }, [driver, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = driverSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
      });
      setErrors(formattedErrors);
      toast.error("Please correct the validation errors.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api(`/drivers/${driver.license_number}`, {
        method: "PUT",
        body: JSON.stringify({
          license_number: data.license_number,
          full_name: data.full_name,
          date_of_birth: toDateString(data.date_of_birth),
          sex:
            data.sex === "M" ? "Male" : data.sex === "F" ? "Female" : data.sex,
          address: data.address,
          license_type: data.license_type,
          license_status: data.license_status,
          issued_at: toDateString(data.issued_at),
          expires_at: toDateString(data.expires_at),
        }),
      });

      const resultJson = await response.json();

      if (!response.ok) {
        throw new Error(resultJson.message || "Failed to update driver.");
      }

      toast.success("Driver updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update driver.", {
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
      title="Edit a Driver"
      description="Edit the details of a driver (* required)."
    >
      <form onSubmit={handleSubmit}>
        <DriverForm
          mode="edit"
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function EditVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle: Vehicle;
}) {
  const [formData, setFormData] = useState<VehicleFormData>({
    plate_number: vehicle.plate_number,
    license_number: vehicle.license_number,
    engine_number: vehicle.engine_number,
    chassis_number: vehicle.chassis_number,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vehicle_type: vehicle.vehicle_type,
    color: vehicle.color,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      plate_number: vehicle.plate_number,
      license_number: vehicle.license_number,
      engine_number: vehicle.engine_number,
      chassis_number: vehicle.chassis_number,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vehicle_type: vehicle.vehicle_type,
      color: vehicle.color,
    });
    setErrors({});
  }, [vehicle, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = vehicleSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
      });
      setErrors(formattedErrors);
      toast.error("Please correct the validation errors.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api(`/vehicles/${vehicle.plate_number}`, {
        method: "PUT",
        body: JSON.stringify({
          engine_number: data.engine_number,
          chassis_number: data.chassis_number,
          make: data.make,
          model: data.model,
          year: data.year,
          vehicle_type: data.vehicle_type,
          color: data.color,
          license_number: data.license_number,
        }),
      });

      const resultJson = await response.json();
      if (!response.ok)
        throw new Error(resultJson.message || "Failed to update vehicle.");

      toast.success("Vehicle updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update vehicle.", {
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
      title="Edit a Vehicle"
      description="Edit the details of a vehicle (* required)."
    >
      <form onSubmit={handleSubmit}>
        <VehicleForm
          mode="edit"
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function EditRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  registration,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registration: VehicleRegistration;
}) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    registration_number: registration.registration_number,
    plate_number: registration.plate_number,
    registration_status: registration.registration_status,
    registration_date: toDate(registration.registration_date),
    expiration_date: toDate(registration.expiration_date),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      registration_number: registration.registration_number,
      plate_number: registration.plate_number,
      registration_status: registration.registration_status,
      registration_date: toDate(registration.registration_date),
      expiration_date: toDate(registration.expiration_date),
    });
    setErrors({});
  }, [registration, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
      });
      setErrors(formattedErrors);
      toast.error("Please correct the validation errors.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api(
        `/registrations/${registration.registration_number}`,
        {
          method: "PUT",
          body: JSON.stringify({
            plate_number: data.plate_number,
            registration_status: data.registration_status,
            registration_date: toDateString(data.registration_date),
            expiration_date: toDateString(data.expiration_date),
          }),
        },
      );

      const resultJson = await response.json();
      if (!response.ok)
        throw new Error(resultJson.message || "Failed to update registration.");

      toast.success("Registration updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update registration.", {
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
      title="Edit a Registration"
      description="Edit the details of a registration (* required)."
    >
      <form onSubmit={handleSubmit}>
        <RegistrationForm
          mode="edit"
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function EditViolationModal({
  isOpen,
  onClose,
  onSuccess,
  violation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  violation: TrafficViolation;
}) {
  const [formData, setFormData] = useState<ViolationFormData>({
    date: toDate(violation.date),
    license_number: violation.license_number,
    plate_number: violation.plate_number,
    location: violation.location,
    violation_type: violation.violation_type,
    fine_amount: violation.fine_amount,
    apprehending_officer: violation.apprehending_officer || "",
    violation_status: violation.violation_status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      date: toDate(violation.date),
      license_number: violation.license_number,
      plate_number: violation.plate_number,
      location: violation.location,
      violation_type: violation.violation_type,
      fine_amount: violation.fine_amount,
      apprehending_officer: violation.apprehending_officer || "",
      violation_status: violation.violation_status,
    });
    setErrors({});
  }, [violation, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = violationSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
      });
      setErrors(formattedErrors);
      toast.error("Please correct the validation errors.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api(`/violations/${violation.violation_id}`, {
        method: "PUT",
        body: JSON.stringify({
          date: toDateString(data.date),
          license_number: data.license_number,
          plate_number: data.plate_number,
          location: data.location,
          violation_type: data.violation_type,
          fine_amount: data.fine_amount,
          apprehending_officer: data.apprehending_officer || "",
          violation_status: data.violation_status,
        }),
      });

      const resultJson = await response.json();
      if (!response.ok)
        throw new Error(resultJson.message || "Failed to update violation.");

      toast.success("Violation updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update violation.", {
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
      title="Edit a Violation"
      description="Edit the details of a violation (* required)."
    >
      <form onSubmit={handleSubmit}>
        <ViolationForm
          mode="edit"
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
