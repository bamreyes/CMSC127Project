import { Request, Response } from "express";
import * as ViolationService from "@/features/violations/violation.service";
import { TrafficViolation } from "@shared";
import { ViolationFilter, ViolationStatus } from "@shared";
import { DriverFilter, Sex, LicenseType, LicenseStatus } from "@shared";
import { VehicleFilter, VehicleType } from "@shared";

export const getAllViolations = async (req: Request, res: Response) => {
  try {
    const result = await ViolationService.getAllViolations();
    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

export const getViolation = async (req: Request, res: Response) => {
  const { violation_id } = req.params;

  if (!violation_id) {
    return res
      .status(400)
      .send({ success: false, error: "Violation id is required" });
  }

  const id = Number(violation_id);

  if (isNaN(id)) {
    return res.status(400).send({
      success: false,
      error: "A valid violation id is required",
    });
  }

  try {
    const result = await ViolationService.getViolation(id);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Violation not found" });
    }

    res.status(201).send({ success: true, data: result });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

export const createViolation = async (req: Request, res: Response) => {
  const {
    date,
    location,
    fine_amount,
    apprehending_officer,
    violation_status,
    violation_type,
    license_number,
    plate_number,
  } = req.body;

  const requiredFields = [
    "date",
    "location",
    "fine_amount",
    "violation_status",
    "violation_type",
    "license_number",
    "plate_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  if (isNaN(new Date(date).getTime())) {
    return res.status(400).send({
      success: false,
      message: "Dates must be in a valid format (YYYY-MM-DD)",
    });
  }

  try {
    const result = await ViolationService.createViolation({
      date,
      location,
      fine_amount,
      apprehending_officer,
      violation_status,
      violation_type,
      license_number,
      plate_number,
    } as TrafficViolation);
    res.status(200).send({
      success: true,
      message: "Violation created successfully",
      data: result,
    });
  } catch (error: any) {
    // should never happen since violation_id is auto-incremented
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send({
        success: false,
        message: "A violation with the same id_number already exists.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message:
          error.message ||
          "The referenced driver's license number or vehicle plate number does not exist.",
      });
    }

    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred.", error });
  }
};

export const deleteViolation = async (req: Request, res: Response) => {
  const { violation_id } = req.params;

  if (!violation_id) {
    return res
      .status(400)
      .send({ success: false, message: "Violation id is required" });
  }

  const id = Number(violation_id);
  if (isNaN(id)) {
    return res.status(400).send({
      success: false,
      error: "A valid violation id is required",
    });
  }

  try {
    const result = await ViolationService.deleteViolation(id);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Violation not found" });
    }

    res.status(200).send({
      success: true,
      message: "Violation successfully deleted",
      deleted_id: result,
    });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

export const updateViolation = async (req: Request, res: Response) => {
  const { violation_id } = req.params;

  if (!violation_id) {
    return res
      .status(400)
      .send({ success: false, message: "Violation id is required" });
  }

  const id = Number(violation_id);
  if (isNaN(id)) {
    return res.status(400).send({
      success: false,
      error: "A valid violation id is required",
    });
  }

  const {
    date,
    location,
    fine_amount,
    apprehending_officer,
    violation_status,
    violation_type,
    license_number,
    plate_number,
  } = req.body;

  const requiredFields = [
    "date",
    "location",
    "fine_amount",
    "violation_status",
    "violation_type",
    "license_number",
    "plate_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  if (isNaN(new Date(date).getTime())) {
    return res.status(400).send({
      success: false,
      message: "Dates must be in a valid format (YYYY-MM-DD)",
    });
  }

  try {
    const result = await ViolationService.updateViolation({
      violation_id: id,
      date,
      location,
      fine_amount,
      apprehending_officer,
      violation_status,
      violation_type,
      license_number,
      plate_number,
    } as TrafficViolation);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Violation not found" });
    }

    res.status(200).send({
      success: true,
      message: "Violation updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message:
          error.message ||
          "The referenced driver's license number or vehicle plate number does not exist.",
      });
    }
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

export const filterViolations = async (req: Request, res: Response) => {
  const {
    min_date,
    max_date,
    location,
    min_fine_amount,
    max_fine_amount,
    apprehending_officer,
    violation_status,
    violation_type,
    plate_number,
    license_number,
  } = req.query;

  if (min_date || max_date) {
    const min = new Date(min_date as string);
    const max = new Date(max_date as string);

    if (isNaN(min.getTime()) || (max_date && isNaN(max.getTime()))) {
      return res.status(400).send({
        success: false,
        message: "Dates must be in a valid format (YYYY-MM-DD)",
      });
    }

    if (min_date && max_date && min > max) {
      return res.status(400).send({
        success: false,
        message: "Minimum date cannot be after maximum date",
      });
    }
  }

  try {
    const result = await ViolationService.filterViolation({
      min_date: min_date ? new Date(min_date as string) : null,
      max_date: max_date ? new Date(max_date as string) : null,
      location: (location as string) || null,
      min_fine_amount: min_fine_amount ? Number(min_fine_amount) : null,
      max_fine_amount: max_fine_amount ? Number(max_fine_amount) : null,
      apprehending_officer: (apprehending_officer as string) || null,
      violation_status: (violation_status as ViolationStatus) || null,
      violation_type: (violation_type as string) || null,
      plate_number: (plate_number as string) || null,
      license_number: (license_number as string) || null,
    } as ViolationFilter);

    res.status(200).send({
      success: true,
      message: `Found ${result.length} record(s)`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
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
    location,
    min_date,
    max_date,
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
    };

    const vMin = min_date ? new Date(min_date as string) : null;
    const vMax = max_date ? new Date(max_date as string) : null;

    const result = await ViolationService.filterViolationByDriver(
      filters,
      vMin,
      vMax,
      (location as string) || null,
    );

    res.status(200).send({
      success: true,
      message: `Found ${result.length} record(s)`,
      data: result,
    });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred", error });
  }
};

export const filterByVehicle = async (req: Request, res: Response) => {
  const {
    plate_number,
    engine_number,
    chassis_number,
    vehicle_type,
    make,
    model,
    min_year,
    max_year,
    color,
    location,
    min_date,
    max_date,
  } = req.query;

  const min = Number(min_year);
  const max = Number(max_year);

  const dateRanges = [{ min: min_date, max: max_date }];

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
    const vMin = min_date ? new Date(min_date as string) : null;
    const vMax = max_date ? new Date(max_date as string) : null;

    const result = await ViolationService.filterViolationByVehicle(
      {
        plate_number: (plate_number as string) || null,
        engine_number: (engine_number as string) || null,
        chassis_number: (chassis_number as string) || null,
        vehicle_type: (vehicle_type as VehicleType) || null,
        make: (make as string) || null,
        model: (model as string) || null,
        max_year: max_year ? Number(max_year) : null,
        min_year: min_year ? Number(min_year) : null,
        color: (color as string) || null,
      } as VehicleFilter,
      vMin,
      vMax,
      (location as string) || null,
    );

    res.status(200).send({
      success: true,
      message: `Found ${result.length} record(s)`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred" });
  }
};

export const groupTypeByYear = async (req: Request, res: Response) => {
  const { year } = req.params;

  if (!year) {
    return res.status(400).json({
      success: false,
      message: "Year is required",
    });
  }

  const parsed = Number(year);

  if (isNaN(parsed)) {
    return res.status(400).json({
      success: false,
      message: "Year must be a valid number",
    });
  }

  try {
    const result = await ViolationService.getTypeCountByYear(parsed);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
