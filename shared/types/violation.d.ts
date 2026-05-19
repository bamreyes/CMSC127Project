export type ViolationStatus = "Unpaid" | "Paid" | "Contested";

export interface TrafficViolation {
  violation_id: number;
  date: string | Date;
  location: string;
  fine_amount: number;
  apprehending_officer: string;
  violation_status: ViolationStatus;
  violation_type: string;
  license_number: string; // References to driver
  plate_number: string; // References to vehicle
  violator_name?: string; // Not in the table
}

export interface ViolationFilter {
  violation_id?: number | null;
  min_date?: string | Date | null;
  max_date?: string | Date | null;
  location?: string | null;
  min_fine_amount?: number | null;
  max_fine_amount?: number | null;
  apprehending_officer?: string | null;
  violation_status?: ViolationStatus | null;
  violation_type?: string | null;
  license_number?: string | null;
  plate_number?: string | null;
  year?: number | null;
}

export interface ViolationFormData {
  date: Date | undefined;
  license_number: string;
  plate_number: string;
  location: string;
  violation_type: string;
  fine_amount: number | "";
  apprehending_officer: string;
  violation_status: ViolationStatus;
}

export interface ViolationFilterData {
  date_min: Date | undefined;
  date_max: Date | undefined;
  license_number: string;
  plate_number: string;
  location: string;
  violation_type: string;
  min_fine_amount: number | "";
  max_fine_amount: number | "";
  apprehending_officer: string;
  violation_status_unpaid: boolean;
  violation_status_paid: boolean;
  violation_status_contested: boolean;
}

export type ViolationTypeCount = {
  violation_type: string;
  count: number;
};
