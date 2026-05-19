export type LicenseType =
  | "Student Permit"
  | "Non-Professional"
  | "Professional";
export type LicenseStatus = "Valid" | "Expired" | "Suspended" | "Revoked";
export type Sex = "M" | "F";

export interface Driver {
  license_number: string;
  full_name: string;
  date_of_birth: string | Date; // Using string | Date to support JSON serialization
  sex: Sex;
  address: string;
  license_type: LicenseType;
  license_status: LicenseStatus;
  issued_at: string | Date;
  expires_at: string | Date;
}

export interface DriverFilter {
  license_number?: string | null;
  full_name?: string | null;
  sex?: Sex | null;
  license_type?: LicenseType | null;
  license_status?: LicenseStatus | null;
  min_bdate?: string | Date | null;
  max_bdate?: string | Date | null;
  address?: string | null;
  min_issued_at?: string | Date | null;
  max_issued_at?: string | Date | null;
  min_expires_at?: string | Date | null;
  max_expires_at?: string | Date | null;
  plate_number?: string | null;
  engine_number?: string | null;
  chassis_number?: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  min_year?: number | null;
  max_year?: number | null;
  min_age?: number | null;
  max_age?: number | null;
}

export interface DriverFormData {
  license_number: string;
  full_name: string;
  date_of_birth: Date | undefined;
  sex: Sex;
  address: string;
  license_type: LicenseType;
  license_status: LicenseStatus;
  issued_at: Date | undefined;
  expires_at: Date | undefined;
}

export interface DriverFilterData {
  license_number: string;
  full_name: string;
  date_of_birth_min: Date | undefined;
  date_of_birth_max: Date | undefined;
  sex_m: boolean;
  sex_f: boolean;
  address: string;
  license_type_nonpro: boolean;
  license_type_pro: boolean;
  license_type_student: boolean;
  license_status_valid: boolean;
  license_status_expired: boolean;
  license_status_suspended: boolean;
  license_status_revoked: boolean;
  issued_at_min: Date | undefined;
  issued_at_max: Date | undefined;
  expires_at_min: Date | undefined;
  expires_at_max: Date | undefined;
}
