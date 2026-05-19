import pool from "@/config/db";
import { VehicleRegistration } from "@shared";
import { RegistrationFilter } from "@shared";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const autoExpireRegistrations = async (connection: any) => {
  await connection.query(
    `UPDATE vehicle_registrations 
     SET registration_status = 'Expired' 
     WHERE expiration_date <= CURDATE() 
       AND registration_status != 'Expired'`,
  );
};

// GET registrations
export const getAllRegistrations = async () => {
  const connection = await pool.getConnection();

  try {
    await autoExpireRegistrations(connection);
    const [result] = (await connection.query(
      `SELECT vr.*, 
              COALESCE(d_vr.full_name, d_v.full_name) AS owner_name,
              COALESCE(vr.license_number, v.license_number) AS license_number
       FROM vehicle_registrations vr
       LEFT JOIN vehicles v ON vr.plate_number = v.plate_number
       LEFT JOIN drivers d_vr ON vr.license_number = d_vr.license_number
       LEFT JOIN drivers d_v ON v.license_number = d_v.license_number`,
    )) as any as [VehicleRegistration[], any];
    return result as VehicleRegistration[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// GET registrations BY registration_number
export const getRegistrationID = async (registration_number: number) => {
  const connection = await pool.getConnection();

  try {
    await autoExpireRegistrations(connection);
    const [result] = await connection.query<RowDataPacket[]>(
      `SELECT vr.*, 
              COALESCE(d_vr.full_name, d_v.full_name) AS owner_name,
              COALESCE(vr.license_number, v.license_number) AS license_number
       FROM vehicle_registrations vr
       LEFT JOIN vehicles v ON vr.plate_number = v.plate_number
       LEFT JOIN drivers d_vr ON vr.license_number = d_vr.license_number
       LEFT JOIN drivers d_v ON v.license_number = d_v.license_number
       WHERE vr.registration_number = ?`,
      [registration_number],
    );

    if (result.length === 0) {
      return null;
    }

    return result[0] as VehicleRegistration;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// GET registrations BY plate_number
export const getRegistrationPlateNo = async (plate_number: string) => {
  const connection = await pool.getConnection();

  try {
    await autoExpireRegistrations(connection);
    const [result] = await connection.query<RowDataPacket[]>(
      `SELECT vr.*, 
              COALESCE(d_vr.full_name, d_v.full_name) AS owner_name,
              COALESCE(vr.license_number, v.license_number) AS license_number
       FROM vehicle_registrations vr
       LEFT JOIN vehicles v ON vr.plate_number = v.plate_number
       LEFT JOIN drivers d_vr ON vr.license_number = d_vr.license_number
       LEFT JOIN drivers d_v ON v.license_number = d_v.license_number
       WHERE vr.plate_number = ?`,
      [plate_number],
    );

    return result as VehicleRegistration[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// GET registrations WHERE status = expired
export const getExpiredRegistrations = async (max_date?: string) => {
  const connection = await pool.getConnection();

  try {
    await autoExpireRegistrations(connection);
    let query = `
      SELECT vr.*, d.full_name AS owner_name, d.license_number 
      FROM vehicle_registrations vr 
      LEFT JOIN vehicles v ON vr.plate_number = v.plate_number 
      LEFT JOIN drivers d ON v.license_number = d.license_number 
      WHERE vr.expiration_date <= CURDATE()
    `;
    const params: any[] = [];
    if (max_date) {
      query = `
        SELECT vr.*, d.full_name AS owner_name, d.license_number 
        FROM vehicle_registrations vr 
        LEFT JOIN vehicles v ON vr.plate_number = v.plate_number 
        LEFT JOIN drivers d ON v.license_number = d.license_number 
        WHERE vr.expiration_date <= ?
      `;
      params.push(max_date);
    }
    const [result] = await connection.query<RowDataPacket[]>(query, params);

    return result as VehicleRegistration[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// POST registration
export const createRegistration = async (
  vehicle_registration: VehicleRegistration,
) => {
  const connection = await pool.getConnection();

  try {
    const [vehicle] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [vehicle_registration.plate_number],
    );
    if (vehicle.length === 0) {
      const err = new Error(
        `Vehicle plate number '${vehicle_registration.plate_number}' does not exist in the database. Please register the vehicle first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    if (vehicle_registration.registration_status === "Active") {
      const [unpaidViolations] = await connection.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM traffic_violations WHERE plate_number = ? AND violation_status = 'Unpaid'",
        [vehicle_registration.plate_number],
      );
      if (
        unpaidViolations &&
        unpaidViolations[0] &&
        (unpaidViolations[0] as any).count > 0
      ) {
        const err = new Error(
          `Cannot register vehicle as Active. The vehicle with plate number '${vehicle_registration.plate_number}' has ${(unpaidViolations[0] as any).count} outstanding unpaid traffic violation(s). Please resolve all violations first.`,
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
    }
    const [overlappingRegs] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM vehicle_registrations 
       WHERE plate_number = ? 
         AND (registration_date <= ? AND expiration_date >= ?)`,
      [
        vehicle_registration.plate_number,
        vehicle_registration.expiration_date,
        vehicle_registration.registration_date,
      ],
    );
    if (
      overlappingRegs &&
      overlappingRegs[0] &&
      (overlappingRegs[0] as any).count > 0
    ) {
      const err = new Error(
        `Cannot register vehicle. The vehicle with plate number '${vehicle_registration.plate_number}' already has a registration that overlaps with the selected date range (${vehicle_registration.registration_date} to ${vehicle_registration.expiration_date}).`,
      );
      (err as any).code = "ER_DUP_ENTRY";
      throw err;
    }
    // Use the provided license_number, or fallback to the vehicle's current owner
    const ownerLicenseNumber =
      vehicle_registration.license_number || (vehicle[0] as any).license_number;

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO vehicle_registrations (registration_number, registration_status, registration_date, expiration_date, plate_number, license_number) VALUES (?, ?, ?, ?, ?, ?)",
      [
        vehicle_registration.registration_number,
        vehicle_registration.registration_status,
        vehicle_registration.registration_date,
        vehicle_registration.expiration_date,
        vehicle_registration.plate_number,
        ownerLicenseNumber,
      ],
    );

    await autoExpireRegistrations(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicle_registrations WHERE registration_number = ?",
      [vehicle_registration.registration_number],
    );

    return rows[0] as VehicleRegistration;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// PUT registration BY registration_number
export const updateRegistration = async (
  vehicle_registration: VehicleRegistration,
) => {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT plate_number FROM vehicle_registrations WHERE registration_number = ?",
      [vehicle_registration.registration_number],
    );

    if (existing && existing.length > 0 && existing[0]) {
      const existingRow = existing[0] as any;
      if (existingRow.plate_number !== vehicle_registration.plate_number) {
        const err = new Error(
          "Security Violation: The vehicle plate number of a registration record is immutable and cannot be transferred to another vehicle.",
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
    }

    const [vehicle] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [vehicle_registration.plate_number],
    );
    if (vehicle.length === 0) {
      const err = new Error(
        `Vehicle plate number '${vehicle_registration.plate_number}' does not exist in the database. Please register the vehicle first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    if (vehicle_registration.registration_status === "Active") {
      const [unpaidViolations] = await connection.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM traffic_violations WHERE plate_number = ? AND violation_status = 'Unpaid'",
        [vehicle_registration.plate_number],
      );
      if (
        unpaidViolations &&
        unpaidViolations[0] &&
        (unpaidViolations[0] as any).count > 0
      ) {
        const err = new Error(
          `Cannot update registration to Active. The vehicle with plate number '${vehicle_registration.plate_number}' has ${(unpaidViolations[0] as any).count} outstanding unpaid traffic violation(s). Please resolve all violations first.`,
        );
        (err as any).code = "ER_DUP_ENTRY";
        throw err;
      }
    }

    const [overlappingRegs] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM vehicle_registrations 
       WHERE plate_number = ? 
         AND registration_number != ? 
         AND (registration_date <= ? AND expiration_date >= ?)`,
      [
        vehicle_registration.plate_number,
        vehicle_registration.registration_number,
        vehicle_registration.expiration_date,
        vehicle_registration.registration_date,
      ],
    );
    if (
      overlappingRegs &&
      overlappingRegs[0] &&
      (overlappingRegs[0] as any).count > 0
    ) {
      const err = new Error(
        `Cannot update registration. The vehicle with plate number '${vehicle_registration.plate_number}' already has a registration that overlaps with the selected date range (${vehicle_registration.registration_date} to ${vehicle_registration.expiration_date}).`,
      );
      (err as any).code = "ER_DUP_ENTRY";
      throw err;
    }

    const ownerLicenseNumber =
      vehicle_registration.license_number || (vehicle[0] as any).license_number;

    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE vehicle_registrations SET registration_status = ?, registration_date = ?, expiration_date = ?, plate_number = ?, license_number = ? WHERE registration_number = ?",
      [
        vehicle_registration.registration_status,
        vehicle_registration.registration_date,
        vehicle_registration.expiration_date,
        vehicle_registration.plate_number,
        ownerLicenseNumber,
        vehicle_registration.registration_number,
      ],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    await autoExpireRegistrations(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicle_registrations WHERE registration_number = ?",
      [vehicle_registration.registration_number],
    );

    return rows[0] as VehicleRegistration;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// DELETE registration
export const deleteRegistration = async (registration_number: number) => {
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM vehicle_registrations WHERE registration_number = ?;",
      [registration_number],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return registration_number;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};
