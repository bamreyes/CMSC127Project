import pool from "@/config/db";
import { TrafficViolation } from "@shared";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { DriverFilter } from "@shared";
import { VehicleFilter } from "@shared";
import { ViolationFilter } from "@shared";
import { autoExpireRegistrations } from "@/features/registrations/registration.service";
import { syncDriverStatuses } from "@/features/drivers/driver.service";

export const getAllViolations = async () => {
  const connection = await pool.getConnection();
  try {
    const [result] = (await connection.query(
      "SELECT * FROM traffic_violations",
    )) as any as [TrafficViolation[], any];
    return result;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const getViolation = async (violation_id: number) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM traffic_violations WHERE violation_id = ?",
      [violation_id],
    );
    return result[0] as TrafficViolation;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const createViolation = async (violation: TrafficViolation) => {
  const connection = await pool.getConnection();
  try {
    // 1. Check if driver exists
    const [driver] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [violation.license_number],
    );
    if (driver.length === 0) {
      const err = new Error(
        `Driver's license number '${violation.license_number}' does not exist in the database. Please register the driver first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    // 2. Check if vehicle exists
    const [vehicle] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [violation.plate_number],
    );
    if (vehicle.length === 0) {
      const err = new Error(
        `Vehicle plate number '${violation.plate_number}' does not exist in the database. Please register the vehicle first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      "INSERT INTO traffic_violations (date,location,fine_amount,apprehending_officer,violation_status,violation_type,license_number,plate_number) VALUES (?,?,?,?,?,?,?,?)",
      [
        violation.date,
        violation.location,
        violation.fine_amount,
        violation.apprehending_officer,
        violation.violation_status,
        violation.violation_type,
        violation.license_number,
        violation.plate_number,
      ],
    );

    await autoExpireRegistrations(connection);
    await syncDriverStatuses(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM traffic_violations WHERE violation_id = ?",
      [insertResult.insertId],
    );
    return rows[0] as TrafficViolation;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const updateViolation = async (violation: TrafficViolation) => {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT license_number, plate_number, violation_type, date, apprehending_officer FROM traffic_violations WHERE violation_id = ?",
      [violation.violation_id],
    );

    if (existing && existing.length > 0 && existing[0]) {
      const existingRow = existing[0] as any;
      const formatDateOnly = (d: any) => {
        if (!d) return "";
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return "";
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const r = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${r}`;
      };

      const cleanString = (val: any) =>
        val === null || val === undefined ? "" : String(val).trim();

      if (existingRow.license_number !== violation.license_number) {
        const err = new Error(
          "The license number of a traffic violation is immutable and cannot be edited.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
      if (existingRow.plate_number !== violation.plate_number) {
        const err = new Error(
          "The vehicle plate number of a traffic violation is immutable and cannot be edited.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
      if (existingRow.violation_type !== violation.violation_type) {
        const err = new Error(
          "The violation type is immutable and cannot be edited.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }

      const existingDateStr = formatDateOnly(existingRow.date);
      const incomingDateStr = formatDateOnly(violation.date);
      if (existingDateStr !== incomingDateStr) {
        const err = new Error(
          "The date of apprehension is immutable and cannot be edited.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
      if (
        cleanString(existingRow.apprehending_officer) !==
        cleanString(violation.apprehending_officer)
      ) {
        const err = new Error(
          "The apprehending officer is immutable and cannot be edited.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
    }

    const [driver] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [violation.license_number],
    );
    if (driver.length === 0) {
      const err = new Error(
        `Driver's license number '${violation.license_number}' does not exist in the database. Please register the driver first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    const [vehicle] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [violation.plate_number],
    );
    if (vehicle.length === 0) {
      const err = new Error(
        `Vehicle plate number '${violation.plate_number}' does not exist in the database. Please register the vehicle first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE traffic_violations SET date=?, location=?, fine_amount=?, apprehending_officer=?, violation_status=?, violation_type=?, license_number=?, plate_number=? WHERE violation_id=?",
      [
        violation.date,
        violation.location,
        violation.fine_amount,
        violation.apprehending_officer,
        violation.violation_status,
        violation.violation_type,
        violation.license_number,
        violation.plate_number,
        violation.violation_id,
      ],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    await autoExpireRegistrations(connection);
    await syncDriverStatuses(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM traffic_violations WHERE violation_id = ?",
      [violation.violation_id],
    );
    return rows[0] as TrafficViolation;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteViolation = async (violation_id: number) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM traffic_violations WHERE violation_id=?",
      [violation_id],
    );

    if (result.affectedRows == 0) {
      return null;
    }

    await autoExpireRegistrations(connection);
    await syncDriverStatuses(connection);

    return violation_id;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// Violations
export const filterViolation = async (violationFilter: ViolationFilter) => {
  const connection = await pool.getConnection();
  const conditions: string[] = [];
  const params: any[] = [];
  const mapping: Record<string, string> = {
    min_date: "date >= ?",
    max_date: "date <= ?",
    min_fine_amount: "fine_amount >= ?",
    max_fine_amount: "fine_amount <= ?",
  };

  Object.entries(violationFilter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const likeFields = ["location", "violation_type", "apprehending_officer"];

    if (likeFields.includes(key)) {
      conditions.push(`${key} LIKE ?`);
      params.push(`%${value}%`);
    } else {
      conditions.push(mapping[key] || `${key} = ?`);
      params.push(value);
    }
  });

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [result] = await connection.query(
      `SELECT * FROM traffic_violations ${where}`,
      params,
    );
    return result as TrafficViolation[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const filterViolationByDriver = async (
  driverFilter: DriverFilter,
  min_date?: Date | null,
  max_date?: Date | null,
  location?: string | null,
) => {
  const connection = await pool.getConnection();
  const conditions: string[] = [];
  const params: any[] = [];
  const mapping: Record<string, string> = {
    min_bdate: "d.date_of_birth >= ?",
    max_bdate: "d.date_of_birth <= ?",
    min_issued_at: "d.issued_at >= ?",
    max_issued_at: "d.issued_at <= ?",
    min_expires_at: "d.expires_at >= ?",
    max_expires_at: "d.expires_at <= ?",
    address: "d.address LIKE ?",
    full_name: "d.full_name LIKE ?",
  };

  Object.entries(driverFilter).forEach(([key, value]) => {
    if (!value) return;
    conditions.push(mapping[key] || `d.${key} = ?`);
    params.push(
      key === "address" || key === "full_name" ? `%${value}%` : value,
    );
  });

  if (min_date) {
    conditions.push("tv.date >= ?");
    params.push(min_date);
  }
  if (max_date) {
    conditions.push("tv.date <= ?");
    params.push(max_date);
  }
  if (location) {
    conditions.push("tv.location LIKE ?");
    params.push(`%${location}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [result] = await connection.query(
      `SELECT tv.* FROM traffic_violations tv INNER JOIN drivers d ON tv.license_number = d.license_number ${whereClause}`,
      params,
    );

    return result as TrafficViolation[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const filterViolationByVehicle = async (
  vehicleFilter: VehicleFilter,
  min_date?: Date | null,
  max_date?: Date | null,
  location?: string | null,
) => {
  const connection = await pool.getConnection();
  const conditions: string[] = [];
  const params: any[] = [];
  const mapping: Record<string, string> = {
    min_year: "v.year >= ?",
    max_year: "v.year <= ?",
    make: "v.make LIKE ?",
    model: "v.model LIKE ?",
    color: "v.color LIKE ?",
  };

  const likeFields = ["make", "model", "color"];

  Object.entries(vehicleFilter).forEach(([key, value]) => {
    if (!value) return;
    conditions.push(mapping[key] || `v.${key} = ?`);
    params.push(likeFields.includes(key) ? `%${value}%` : value);
  });

  if (min_date) {
    conditions.push("tv.date >= ?");
    params.push(min_date);
  }
  if (max_date) {
    conditions.push("tv.date <= ?");
    params.push(max_date);
  }
  if (location) {
    conditions.push("tv.location LIKE ?");
    params.push(`%${location}%`);
  }

  const vehicleWhere =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [result] = await connection.query(
      `SELECT tv.* FROM traffic_violations tv INNER JOIN vehicles v ON tv.plate_number = v.plate_number ${vehicleWhere}`,
      params,
    );

    return result as TrafficViolation[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// By Type and Year
export const getTypeCountByYear = async (year: number) => {
  const [result] = await pool.query(
    "SELECT violation_type, COUNT(*) as count FROM traffic_violations WHERE YEAR(date) = ? GROUP BY violation_type",
    [year],
  );
  return result;
};
