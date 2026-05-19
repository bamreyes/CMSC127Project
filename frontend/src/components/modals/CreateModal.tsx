import React, { useState, useEffect } from "react";
import BaseModal from "@/components/modals/BaseModal";
import {
  DriverForm,
  defaultDriverFormData,
} from "@/components/modals/forms/DriverForm";
import type { DriverFormData } from "@/components/modals/forms/DriverForm";
import { VehicleForm, defaultVehicleFormData } from "./forms/VehicleForm";
import type { VehicleFormData } from "./forms/VehicleForm";
import {
  RegistrationForm,
  defaultRegistrationFormData,
} from "./forms/RegistrationForm";
import type { RegistrationFormData } from "./forms/RegistrationForm";
import { ViolationForm, defaultViolationFormData } from "./forms/ViolationForm";
import type { ViolationFormData } from "./forms/ViolationForm";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  driverSchema,
  vehicleSchema,
  registrationSchema,
  violationSchema,
} from "@/lib/validation";

const toDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
};

export function CreateDriverModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<DriverFormData>(
    defaultDriverFormData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultDriverFormData);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = driverSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      let toastMessage = "";
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
        if (!issue.message.toLowerCase().includes("required")) {
          toastMessage = issue.message;
        }
      });
      setErrors(formattedErrors);
      if (toastMessage) {
        toast.error(toastMessage);
      }
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api("/drivers", {
        method: "POST",
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
        throw new Error(resultJson.message || "Failed to create driver.");
      }

      toast.success("Driver created successfully.");
      setFormData(defaultDriverFormData);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create driver.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a Driver"
      description="Enter the details of a driver to be added (* required)."
    >
      <form onSubmit={handleSubmit}>
        <DriverForm
          mode="create"
          formData={formData}
          onChange={(newData) => {
            setFormData(newData);
            const updatedErrors = { ...errors };
            let changed = false;
            for (const key in errors) {
              if (
                newData[key as keyof DriverFormData] !==
                formData[key as keyof DriverFormData]
              ) {
                delete updatedErrors[key];
                changed = true;
              }
            }
            if (changed) setErrors(updatedErrors);
          }}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function CreateVehicleModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<VehicleFormData>(
    defaultVehicleFormData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultVehicleFormData);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = vehicleSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      let toastMessage = "";
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
        if (!issue.message.toLowerCase().includes("required")) {
          toastMessage = issue.message;
        }
      });
      setErrors(formattedErrors);
      if (toastMessage) {
        toast.error(toastMessage);
      }
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // Check if the driver has a student permit.
      const driverRes = await api(
        `/drivers/${encodeURIComponent(formData.license_number)}`,
      );
      if (driverRes.ok) {
        const driverJson = await driverRes.json();
        if (driverJson.success && driverJson.data) {
          const licenseType = driverJson.data.license_type;
          if (licenseType === "Student Permit") {
            setErrors({
              license_number:
                "A person with a student permit is not allowed to own a vehicle.",
            });
            toast.error(
              "A person with a student permit is not allowed to own a vehicle.",
              {
                description:
                  "Drivers holding a Student Permit cannot register or own any vehicles.",
              },
            );
            setSubmitting(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Failed to verify driver's license type", err);
    }

    try {
      const data = result.data;
      const response = await api("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          plate_number: data.plate_number,
          license_number: data.license_number,
          engine_number: data.engine_number,
          chassis_number: data.chassis_number,
          make: data.make,
          model: data.model,
          year: data.year,
          vehicle_type: data.vehicle_type,
          color: data.color,
        }),
      });

      const resultJson = await response.json();
      if (!response.ok)
        throw new Error(resultJson.message || "Failed to create vehicle.");

      toast.success("Vehicle created successfully.");
      setFormData(defaultVehicleFormData);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create vehicle.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a Vehicle"
      description="Enter the details of a vehicle to be added (* required)."
    >
      <form onSubmit={handleSubmit}>
        <VehicleForm
          mode="create"
          formData={formData}
          onChange={(newData) => {
            setFormData(newData);
            const updatedErrors = { ...errors };
            let changed = false;
            for (const key in errors) {
              if (
                newData[key as keyof VehicleFormData] !==
                formData[key as keyof VehicleFormData]
              ) {
                delete updatedErrors[key];
                changed = true;
              }
            }
            if (changed) setErrors(updatedErrors);
          }}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function CreateRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<RegistrationFormData>(
    defaultRegistrationFormData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultRegistrationFormData);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      let toastMessage = "";
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
        if (!issue.message.toLowerCase().includes("required")) {
          toastMessage = issue.message;
        }
      });
      setErrors(formattedErrors);
      if (toastMessage) {
        toast.error(toastMessage);
      }
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;

      // Fetch the vehicle to retrieve its associated license_number
      let license_number = undefined;
      try {
        const vehicleRes = await api(
          `/vehicles/${encodeURIComponent(data.plate_number)}`,
        );
        if (vehicleRes.ok) {
          const vehicleJson = await vehicleRes.json();
          if (vehicleJson.success && vehicleJson.data) {
            license_number = vehicleJson.data.license_number;
          }
        }
      } catch (e) {
        console.error("Failed to fetch vehicle to get license_number:", e);
      }

      const response = await api("/registrations", {
        method: "POST",
        body: JSON.stringify({
          registration_number: data.registration_number,
          plate_number: data.plate_number,
          registration_status: data.registration_status,
          registration_date: toDateString(data.registration_date),
          expiration_date: toDateString(data.expiration_date),
          license_number,
        }),
      });

      const resultJson = await response.json();
      if (!response.ok)
        throw new Error(resultJson.message || "Failed to create registration.");

      toast.success("Registration created successfully.");
      setFormData(defaultRegistrationFormData);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create registration.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a Registration"
      description="Enter the details of a registration to be added (* required)."
    >
      <form onSubmit={handleSubmit}>
        <RegistrationForm
          mode="create"
          formData={formData}
          onChange={(newData) => {
            setFormData(newData);
            const updatedErrors = { ...errors };
            let changed = false;
            for (const key in errors) {
              if (
                newData[key as keyof RegistrationFormData] !==
                formData[key as keyof RegistrationFormData]
              ) {
                delete updatedErrors[key];
                changed = true;
              }
            }
            if (changed) setErrors(updatedErrors);
          }}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export function CreateViolationModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<ViolationFormData>(
    defaultViolationFormData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultViolationFormData);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = violationSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      let toastMessage = "";
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          formattedErrors[path] = issue.message;
        }
        if (!issue.message.toLowerCase().includes("required")) {
          toastMessage = issue.message;
        }
      });
      setErrors(formattedErrors);
      if (toastMessage) {
        toast.error(toastMessage);
      }
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = result.data;
      const response = await api("/violations", {
        method: "POST",
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
        throw new Error(resultJson.message || "Failed to create violation.");

      toast.success("Violation created successfully.");
      setFormData(defaultViolationFormData);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create violation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a Violation"
      description="Enter the details of a violation to be added (* required)."
    >
      <form onSubmit={handleSubmit}>
        <ViolationForm
          mode="create"
          formData={formData}
          onChange={(newData) => {
            setFormData(newData);
            const updatedErrors = { ...errors };
            let changed = false;
            for (const key in errors) {
              if (
                newData[key as keyof ViolationFormData] !==
                formData[key as keyof ViolationFormData]
              ) {
                delete updatedErrors[key];
                changed = true;
              }
            }
            if (changed) setErrors(updatedErrors);
          }}
          errors={errors}
        />
        <div className="mt-6 flex justify-end">
          <Button className="rounded-lg" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
