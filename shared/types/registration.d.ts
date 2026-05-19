export type RegistrationStatus = "Active" | "Expired" | "Suspended";
export type DateField = "registration_date" | "expiration_date";

export interface VehicleRegistration {
  registration_number: number;
  registration_status: RegistrationStatus;
  registration_date: string | Date;
  expiration_date: string | Date;
  plate_number: string; // References to vehicle
  owner_name?: string;
  license_number?: string; // Fetched via JOIN
}

export interface RegistrationFilter {
  registration_status?: RegistrationStatus;
  date_field?: DateField;
  min_date?: string | Date | null | undefined;
  max_date?: string | Date | null | undefined;
}

export interface RegistrationFormData {
  registration_number: number | "";
  plate_number: string;
  registration_status: RegistrationStatus;
  registration_date: Date | undefined;
  expiration_date: Date | undefined;
}

export interface RegistrationFilterData {
  registration_number: number | "";
  plate_number: string;
  registration_status_active: boolean;
  registration_status_expired: boolean;
  registration_status_suspended: boolean;
  registration_date_min: Date | undefined;
  registration_date_max: Date | undefined;
  expiration_date_min: Date | undefined;
  expiration_date_max: Date | undefined;
}
