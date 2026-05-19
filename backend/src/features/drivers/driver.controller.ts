import { Request, Response } from "express";
import * as DriverService from "@/features/drivers/driver.service";
import { Driver } from "@shared";
import { LicenseType, LicenseStatus, Sex, DriverFilter } from "@shared";

// GET /api/drivers
export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const result = await DriverService.getAllDrivers();
    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET /api/drivers/:license_number
export const getDriver = async (req: Request, res: Response) => {
  let license_number = req.params.license_number as string;
  if (license_number) license_number = license_number.toUpperCase().trim();

  if (!license_number) {
    return res
      .status(400)
      .send({ success: false, error: "License number is required" });
  }

  if (typeof license_number !== "string" || license_number.trim() === "") {
    return res.status(400).send({
      success: false,
      error: "A valid license number string is required",
    });
  }

  try {
    const result = await DriverService.getDriver(license_number);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Driver not found" });
    }

    res.status(201).send({ success: true, data: result });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

// POST /api/drivers
export const createDriver = async (req: Request, res: Response) => {
  const {
    license_number,
    full_name,
    date_of_birth,
    sex,
    address,
    license_type,
    license_status,
    issued_at,
    expires_at,
  } = req.body;

  const requiredFields = [
    "license_number",
    "full_name",
    "date_of_birth",
    "sex",
    "address",
    "license_type",
    "license_status",
    "issued_at",
    "expires_at",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  if (
    isNaN(new Date(issued_at).getTime()) ||
    isNaN(new Date(expires_at).getTime()) ||
    isNaN(new Date(date_of_birth).getTime())
  ) {
    return res.status(400).send({
      success: false,
      message: "Dates must be in a valid format (YYYY-MM-DD)",
    });
  }

  if (new Date(expires_at) <= new Date(issued_at)) {
    return res.status(400).send({
      success: false,
      error: "Expiration date cannot be on or before issuance date",
    });
  }

  try {
    const result = await DriverService.createDriver({
      license_number,
      full_name,
      date_of_birth,
      sex,
      address,
      license_type,
      license_status,
      issued_at,
      expires_at,
    } as Driver);
    res.status(200).send({
      success: true,
      message: "Driver created successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send({
        success: false,
        message: "A driver with this license number already exists.",
      });
    }

    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  let license_number = req.params.license_number as string;
  if (license_number) license_number = license_number.toUpperCase().trim();

  if (!license_number) {
    return res
      .status(400)
      .send({ success: false, message: "License number is required" });
  }

  if (typeof license_number !== "string" || license_number.trim() === "") {
    return res.status(400).send({
      success: false,
      message: "A valid license number string is required",
    });
  }

  const {
    full_name,
    date_of_birth,
    sex,
    address,
    license_type,
    license_status,
    issued_at,
    expires_at,
  } = req.body;

  const requiredFields = [
    "full_name",
    "date_of_birth",
    "sex",
    "address",
    "license_type",
    "license_status",
    "issued_at",
    "expires_at",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is missing` });
    }
  }

  if (
    isNaN(new Date(issued_at).getTime()) ||
    isNaN(new Date(expires_at).getTime()) ||
    isNaN(new Date(date_of_birth).getTime())
  ) {
    return res.status(400).send({
      success: false,
      message: "Dates must be in a valid format (YYYY-MM-DD)",
    });
  }

  if (new Date(expires_at) <= new Date(issued_at)) {
    return res.status(400).send({
      success: false,
      message: "Expiration date cannot be on or before issuance date",
    });
  }

  try {
    const result = await DriverService.updateDriver({
      license_number,
      full_name,
      date_of_birth,
      sex,
      address,
      license_type,
      license_status,
      issued_at,
      expires_at,
    } as Driver);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Driver not found" });
    }

    res.status(200).send({
      success: true,
      message: "Driver updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (
      error.code === "ER_ROW_IS_REFERENCED" ||
      error.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).send({ success: false, message: error.message });
    }
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

// DELETE /api/drivers/:license_number
export const deleteDriver = async (req: Request, res: Response) => {
  let license_number = req.params.license_number as string;
  if (license_number) license_number = license_number.toUpperCase().trim();

  if (!license_number) {
    return res
      .status(400)
      .send({ success: false, message: "License number is required" });
  }

  if (typeof license_number !== "string" || license_number.trim() === "") {
    return res.status(400).send({
      success: false,
      message: "A valid license number string is required",
    });
  }

  try {
    const result = await DriverService.deleteDriver(license_number);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Driver not found" });
    }

    res.status(200).send({
      success: true,
      message: "Driver successfully deleted",
      deleted_id: result,
    });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).send({ success: false, message: error.message });
    }
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET /api/drivers/filter/
export const filterDrivers = async (req: Request, res: Response) => {
  const {
    license_type,
    license_status,
    min_bdate,
    max_bdate,
    sex,
    address,
    license_number,
    full_name,
    min_age,
    max_age,
  } = req.query;

  if (min_bdate || max_bdate) {
    const minD = min_bdate ? new Date(min_bdate as string) : null;
    const maxD = max_bdate ? new Date(max_bdate as string) : null;

    if (
      (min_bdate && isNaN(minD!.getTime())) ||
      (max_bdate && isNaN(maxD!.getTime()))
    ) {
      return res.status(400).send({
        success: false,
        message: "Dates must be in a valid format (YYYY-MM-DD)",
      });
    }
    if (minD && maxD && minD > maxD) {
      return res.status(400).send({
        success: false,
        message: "Minimum date cannot be after maximum date",
      });
    }
  }

  if (min_age) {
    const minAgeNum = parseInt(min_age as string, 10);
    if (isNaN(minAgeNum) || minAgeNum < 0) {
      return res.status(400).send({
        success: false,
        message: "Minimum age must be a non-negative number",
      });
    }
  }
  if (max_age) {
    const maxAgeNum = parseInt(max_age as string, 10);
    if (isNaN(maxAgeNum) || maxAgeNum < 0) {
      return res.status(400).send({
        success: false,
        message: "Maximum age must be a non-negative number",
      });
    }
  }
  if (min_age && max_age) {
    const minAgeNum = parseInt(min_age as string, 10);
    const maxAgeNum = parseInt(max_age as string, 10);
    if (minAgeNum > maxAgeNum) {
      return res.status(400).send({
        success: false,
        message: "Minimum age cannot be greater than maximum age",
      });
    }
  }

  try {
    const result = await DriverService.filterDriver({
      sex: (sex as Sex) ?? null,
      license_type: (license_type as LicenseType) ?? null,
      license_status: (license_status as LicenseStatus) ?? null,
      min_bdate: min_bdate ? new Date(min_bdate as string) : null,
      max_bdate: max_bdate ? new Date(max_bdate as string) : null,
      address: (address as string) ?? null,
      license_number: (license_number as string) ?? null,
      full_name: (full_name as string) ?? null,
      min_age: min_age ? parseInt(min_age as string, 10) : null,
      max_age: max_age ? parseInt(max_age as string, 10) : null,
    });

    res.status(200).send({
      success: true,
      message: `Found ${result.length} driver(s)`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message || "An error occurred." });
  }
};
