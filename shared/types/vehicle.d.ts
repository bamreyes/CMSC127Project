import { VehicleRegistration } from "./registration";
import { TrafficViolation } from "./violation";

export type VehicleType = "Motorcycle" | "Private Car" | "Public Utility Vehicle";

export interface Vehicle {
  plate_number: string;
  engine_number: string;
  chassis_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  license_number: string; // References to driver
  owner_name?: string; // Fetched via JOIN
  registrations?: VehicleRegistration[];
  violations?: TrafficViolation[];
}

export interface VehicleFilter {
  plate_number?: string | null;
  engine_number?: string | null;
  chassis_number?: string | null;
  vehicle_type?: VehicleType | null;
  make?: string | null;
  model?: string | null;
  min_year?: number | null;
  max_year?: number | null;
  color?: string | null;
}

export interface VehicleFormData {
  plate_number: string;
  license_number: string;
  engine_number: string;
  chassis_number: string;
  make: string;
  model: string;
  year: number | "";
  vehicle_type: VehicleType;
  color: string;
}

export interface VehicleFilterData {
  plate_number: string;
  license_number: string;
  engine_number: string;
  chassis_number: string;
  make: string;
  model: string;
  min_year: number | "";
  max_year: number | "";
  vehicle_type_private: boolean;
  vehicle_type_puv: boolean;
  vehicle_type_motor: boolean;
  color: string;
}

