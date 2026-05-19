import { Request, Response } from "express";
import * as RegistrationService from "@/features/registrations/registration.service";
import { VehicleRegistration } from "@shared";

// For consistent date formats.
function formatDate(dateString: string): string {
  const newDate = new Date(dateString);

  return newDate.toISOString().slice(0, 10); // Convert to ISO string then cut.
}

// GET /api/registrations
export const getAllRegistrations = async (req: Request, res: Response) => {
  try {
    const result = await RegistrationService.getAllRegistrations();
    if (!result || result.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Vehicle registration(s) not found.",
      });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET /api/registrations/:registration_number
export const getRegistrationID = async (req: Request, res: Response) => {
  const { registration_number } = req.params;
  const regNum = parseInt(registration_number as string, 10); // Convert to int.

  if (isNaN(regNum)) {
    return res
      .status(400)
      .send({ success: false, error: "Registration number must be a number." });
  }

  try {
    const result = await RegistrationService.getRegistrationID(regNum);
    if (!result) {
      return res.status(404).send({
        success: false,
        message: "Vehicle registration not found.",
      });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET /api/registrations/:plate_number
export const getRegistrationPlateNo = async (req: Request, res: Response) => {
  let plate_number = req.params.plate_number as string;
  if (plate_number) plate_number = plate_number.toUpperCase().trim();

  if (typeof plate_number !== "string") {
    return res
      .status(400)
      .send({ success: false, error: "Plate number must be a string." });
  }

  try {
    const result =
      await RegistrationService.getRegistrationPlateNo(plate_number);
    if (!result || result.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Vehicle registration(s) not found.",
      });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// GET /api/registrations/expired
export const getExpiredRegistrations = async (req: Request, res: Response) => {
  const { max_date } = req.query;
  try {
    const result = await RegistrationService.getExpiredRegistrations(
      max_date as string,
    );
    if (!result || result.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Vehicle registration(s) not found.",
      });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// POST /api/registrations
export const createRegistration = async (req: Request, res: Response) => {
  const {
    registration_number,
    registration_status,
    registration_date,
    expiration_date,
    plate_number,
    license_number,
  } = req.body;

  const requiredFields = [
    "registration_number",
    "registration_status",
    "registration_date",
    "expiration_date",
    "plate_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is required.` });
    }
  }

  if (isNaN(Number(registration_number))) {
    return res.status(400).send({
      success: false,
      message: "Registration number must be a number.",
    });
  }

  if (
    isNaN(new Date(registration_date).getTime()) ||
    isNaN(new Date(expiration_date).getTime())
  ) {
    return res.status(400).send({
      success: false,
      message: "Date(s) must be in a valid format (YYYY-MM-DD).",
    });
  }

  const newRegDate = formatDate(registration_date);
  const newExpDate = formatDate(expiration_date);

  if (new Date(newExpDate) <= new Date(newRegDate)) {
    return res.status(400).send({
      success: false,
      error: "Expiration date cannot be on or before registration date.",
    });
  }

  try {
    const result = await RegistrationService.createRegistration({
      registration_number,
      registration_status,
      registration_date: new Date(newRegDate),
      expiration_date: new Date(newExpDate),
      plate_number,
      license_number,
    } as VehicleRegistration);
    res.status(201).send({
      success: true,
      message: "Vehicle registration created successfully.",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      const isPrimaryKeyDup =
        error.message && error.message.includes("PRIMARY");
      return res.status(409).send({
        success: false,
        message: isPrimaryKeyDup
          ? "A vehicle registration with this registration number already exists."
          : error.message || "A duplicate entry error occurred.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message: error.message || "The referenced plate number does not exist.",
      });
    }

    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// PUT /api/registrations/:registration_number
export const updateRegistration = async (req: Request, res: Response) => {
  const { registration_number } = req.params;
  const regNum = parseInt(registration_number as string, 10); // Convert to int.

  if (isNaN(regNum)) {
    return res
      .status(400)
      .send({ success: false, error: "Registration number must be a number." });
  }

  const {
    registration_status,
    registration_date,
    expiration_date,
    plate_number,
    license_number,
  } = req.body;

  const requiredFields = [
    "registration_status",
    "registration_date",
    "expiration_date",
    "plate_number",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .send({ success: false, message: `'${field}' is required.` });
    }
  }

  if (
    isNaN(new Date(registration_date).getTime()) ||
    isNaN(new Date(expiration_date).getTime())
  ) {
    return res.status(400).send({
      success: false,
      message: "Date(s) must be in a valid format (YYYY-MM-DD).",
    });
  }

  if (new Date(expiration_date) <= new Date(registration_date)) {
    return res.status(400).send({
      success: false,
      message: "Expiration date cannot be on or before registration date.",
    });
  }

  const newRegDate = formatDate(registration_date);
  const newExpDate = formatDate(expiration_date);

  try {
    const result = await RegistrationService.updateRegistration({
      registration_status,
      registration_date: new Date(newRegDate),
      expiration_date: new Date(newExpDate),
      plate_number,
      license_number,
      registration_number: regNum,
    } as VehicleRegistration);
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: "Vehicle registration not found." });
    }

    res.status(200).send({
      success: true,
      message: "Vehicle registration updated successfully.",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      const isPrimaryKeyDup =
        error.message && error.message.includes("PRIMARY");
      return res.status(409).send({
        success: false,
        message: isPrimaryKeyDup
          ? "A vehicle registration with this registration number already exists."
          : error.message || "A duplicate entry error occurred.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).send({
        success: false,
        message: error.message || "The referenced plate number does not exist.",
      });
    }
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};

// DELETE /api/registrations/:registration_number
export const deleteRegistration = async (req: Request, res: Response) => {
  const { registration_number } = req.params;
  const regNum = parseInt(registration_number as string, 10); // Convert to int.

  if (isNaN(regNum)) {
    return res
      .status(400)
      .send({ success: false, error: "Registration number must be a number." });
  }

  try {
    const result = await RegistrationService.deleteRegistration(regNum);
    if (result === null) {
      return res.status(404).send({
        success: false,
        message: "Vehicle registration not found.",
      });
    }

    res.status(200).send({ success: true, data: result });
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, message: error.message || "An error occurred." });
  }
};
