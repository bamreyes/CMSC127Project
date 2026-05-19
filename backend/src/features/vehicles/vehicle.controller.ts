import { Request, Response } from "express";
import * as VehicleService from "@/features/vehicles/vehicle.service";
import { Vehicle } from "@shared";
import { DriverFilter, LicenseType, LicenseStatus, Sex } from "@shared";

// GET  all vehicles
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const result = await VehicleService.getAllVehicles();
    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET vehicle
export const getVehicle = async (req: Request, res: Response) => {
  let plate_number = req.params.plate_number as string;
  if (plate_number) plate_number = plate_number.toUpperCase().trim();

  if (!plate_number) {
    return res
      .status(400)
      .send({ success: false, error: "Plate number is required" });
  }

  if (typeof plate_number !== "string" || plate_number.trim() === "") {
    return res.status(400).send({
      success: false,
      error: "A valid plate number string is required",
    });
  }

  try {
    const result = await VehicleService.getVehicle(plate_number);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Vehicle not found" });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// POST create vehicle
export const createVehicle = async (req: Request, res: Response) => {
  const {
    plate_number,
    engine_number,
    chassis_number,
    vehicle_type,
    make,
    model,
    year,
    color,
    license_number,
  } = req.body;

  const requiredFields = [
    "plate_number",
    "engine_number",
    "chassis_number",
    "vehicle_type",
    "make",
    "model",
    "year",
    "color",
    "license_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  try {
    const result = await VehicleService.createVehicle({
      plate_number,
      engine_number,
      chassis_number,
      vehicle_type,
      make,
      model,
      year,
      color,
      license_number,
    } as Vehicle);
    res.status(200).send({
      success: true,
      message: "Vehicle created successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send({
        success: false,
        message:
          "A vehicle with this plate number, engine number, or chassis number already exists.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message:
          error.message || "The referenced license number does not exist",
      });
    }

    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred" });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  let plate_number = req.params.plate_number as string;
  if (plate_number) plate_number = plate_number.toUpperCase().trim();

  if (!plate_number) {
    return res
      .status(400)
      .send({ success: false, message: "Plate number is required" });
  }

  if (typeof plate_number !== "string" || plate_number.trim() === "") {
    return res.status(400).send({
      success: false,
      message: "A valid plate number string is required",
    });
  }

  const {
    engine_number,
    chassis_number,
    vehicle_type,
    make,
    model,
    year,
    color,
    license_number,
  } = req.body;

  const requiredFields = [
    "engine_number",
    "chassis_number",
    "vehicle_type",
    "make",
    "model",
    "year",
    "color",
    "license_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  try {
    const result = await VehicleService.updateVehicle({
      plate_number,
      engine_number,
      chassis_number,
      vehicle_type,
      make,
      model,
      year,
      color,
      license_number,
    } as Vehicle);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Vehicle not found" });
    }

    res.status(200).send({
      success: true,
      message: "Vehicle updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send({
        success: false,
        message:
          error.message ||
          "A vehicle with this plate number, engine number, or chassis number already exists.",
      });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message:
          error.message || "The referenced license number does not exist",
      });
    }
    res.status(500).send({
      success: false,
      message: error.message || "An error occurred",
    });
  }
};
export const deleteVehicle = async (req: Request, res: Response) => {
  let plate_number = req.params.plate_number as string;
  if (plate_number) plate_number = plate_number.toUpperCase().trim();

  if (!plate_number) {
    return res
      .status(400)
      .send({ success: false, message: "Plate number is required" });
  }

  if (typeof plate_number !== "string" || plate_number.trim() === "") {
    return res.status(400).send({
      success: false,
      message: "A valid plate number string is required",
    });
  }

  try {
    const result = await VehicleService.deleteVehicle(plate_number);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Vehicle not found" });
    }

    res.status(200).send({
      success: true,
      message: "Vehicle successfully deleted",
      deleted_id: result,
    });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).send({ success: false, message: error.message });
    }
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

export const filterByDriver = async (req: Request, res: Response) => {
  const {
    full_name,
    min_bdate,
    max_bdate,
    sex,
    address,
    license_type,
    license_status,
    min_issued_at,
    max_issued_at,
    min_expires_at,
    max_expires_at,
    license_number,
    min_date,
    max_date,
    plate_number,
    engine_number,
    chassis_number,
    vehicle_type,
    make,
    model,
    color,
    min_year,
    max_year,
  } = req.query;

  const dateRanges = [
    { min: min_date, max: max_date },
    { min: min_issued_at, max: max_issued_at },
    { min: min_expires_at, max: max_expires_at },
    { min: min_bdate, max: max_bdate },
  ];

  for (const range of dateRanges) {
    const { min, max } = range;
    if (min || max) {
      const minD = min ? new Date(min as string) : null;
      const maxD = max ? new Date(max as string) : null;
      if ((min && isNaN(minD!.getTime())) || (max && isNaN(maxD!.getTime()))) {
        return res.status(400).send({
          success: false,
          message: "Date  must be in a valid format (YYYY-MM-DD)",
        });
      }
      if (minD && maxD && minD > maxD) {
        return res.status(400).send({
          success: false,
          message: `Minimum cannot be after maximum`,
        });
      }
    }
  }

  try {
    const filters: DriverFilter = {
      full_name: (full_name as string) || null,
      sex: (sex as Sex) || null,
      address: (address as string) || null,
      license_number: (license_number as string) || null,
      license_type: (license_type as LicenseType) || null,
      license_status: (license_status as LicenseStatus) || null,
      min_bdate: min_bdate ? new Date(min_bdate as string) : null,
      max_bdate: max_bdate ? new Date(max_bdate as string) : null,
      min_issued_at: min_issued_at ? new Date(min_issued_at as string) : null,
      max_issued_at: max_issued_at ? new Date(max_issued_at as string) : null,
      min_expires_at: min_expires_at
        ? new Date(min_expires_at as string)
        : null,
      max_expires_at: max_expires_at
        ? new Date(max_expires_at as string)
        : null,
      plate_number: (plate_number as string) || null,
      engine_number: (engine_number as string) || null,
      chassis_number: (chassis_number as string) || null,
      vehicle_type: (vehicle_type as string) || null,
      make: (make as string) || null,
      model: (model as string) || null,
      color: (color as string) || null,
      min_year: min_year ? Number(min_year) : null,
      max_year: max_year ? Number(max_year) : null,
    };

    const result = await VehicleService.filterVehicleByDriver(filters);

    res.status(200).send({
      success: true,
      message: `Found ${result.length} vehicle(s)`,
      data: result,
    });
  } catch (error: any) {
    res
      .status(500)
      .send({
        success: false,
        message: error.message || "An error occurred",
        error,
      });
  }
};
