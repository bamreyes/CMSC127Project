import pool from "@/config/db";
import { Vehicle } from "@shared";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { DriverFilter } from "@shared";

export const getAllVehicles = async () => {
  const connection = await pool.getConnection();
  try {
    const [result] = (await connection.query(
      "SELECT * FROM vehicles",
    )) as any as [Vehicle[], any];
    return result;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const getVehicle = async (plate_number: string) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [plate_number],
    );
    return result[0] as Vehicle;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const createVehicle = async (vehicle: Vehicle) => {
  const connection = await pool.getConnection();
  try {
    const [driver] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [vehicle.license_number],
    );
    if (driver.length === 0) {
      const err = new Error(
        `Driver's license number '${vehicle.license_number}' does not exist in the database. Please register the driver first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    // Driver exists. A driver with any license status (Active, Suspended, Expired) can legally own/be assigned to a vehicle.

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO vehicles (plate_number, engine_number, chassis_number, vehicle_type, make, model, year, color, license_number) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        vehicle.plate_number,
        vehicle.engine_number,
        vehicle.chassis_number,
        vehicle.vehicle_type,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.license_number,
      ],
    );

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [vehicle.plate_number],
    );
    return rows[0] as Vehicle;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const updateVehicle = async (vehicle: Vehicle) => {
  const connection = await pool.getConnection();
  try {
    const [driver] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [vehicle.license_number],
    );
    if (driver.length === 0) {
      const err = new Error(
        `Driver's license number '${vehicle.license_number}' does not exist in the database. Please register the driver first.`,
      );
      (err as any).code = "ER_NO_REFERENCED_ROW_2";
      throw err;
    }

    // Check if the driver is actually being changed
    const [existingVehicle] = await connection.query<RowDataPacket[]>(
      "SELECT license_number FROM vehicles WHERE plate_number = ?",
      [vehicle.plate_number]
    );

    if (existingVehicle && existingVehicle.length > 0 && existingVehicle[0]) {
      const oldDriverLicense = existingVehicle[0].license_number;
      if (oldDriverLicense !== vehicle.license_number) {
        // Driver is being changed! Check for outstanding unpaid violations on the vehicle
        const [unpaidViolations] = await connection.query<RowDataPacket[]>(
          "SELECT COUNT(*) as count FROM traffic_violations WHERE plate_number = ? AND violation_status = 'Unpaid'",
          [vehicle.plate_number]
        );
        if (unpaidViolations && unpaidViolations[0] && (unpaidViolations[0] as any).count > 0) {
          const err = new Error(
            `Cannot change the vehicle's driver. The vehicle with plate number '${vehicle.plate_number}' has ${(unpaidViolations[0] as any).count} outstanding unpaid traffic violation(s). All violations must be settled before changing the assigned driver.`
          );
          (err as any).code = "ER_DUP_ENTRY";
          throw err;
        }
      }
    }

    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE vehicles SET engine_number=?, chassis_number=?, vehicle_type=?, make=?, model=?, year=?, color=?, license_number=? WHERE plate_number=?",
      [
        vehicle.engine_number,
        vehicle.chassis_number,
        vehicle.vehicle_type,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.license_number,
        vehicle.plate_number,
      ],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vehicles WHERE plate_number = ?",
      [vehicle.plate_number],
    );
    return rows[0] as Vehicle;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteVehicle = async (plate_number: string) => {
  const connection = await pool.getConnection();

  try {
    await connection.query(
      "UPDATE vehicle_registrations SET registration_status = 'Expired' WHERE registration_status = 'Active' AND expiration_date <= CURDATE()"
    );

    const [activeRegistrations] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM vehicle_registrations WHERE plate_number = ? AND registration_status = 'Active' AND expiration_date > CURDATE()",
      [plate_number],
    );
    if (activeRegistrations[0] && activeRegistrations[0].count > 0) {
      const err = new Error(
        `Cannot delete vehicle. Vehicle currently has an active registration in the database. Deletion is only allowed for vehicles with expired registrations.`,
      );
      (err as any).code = "ER_ROW_IS_REFERENCED";
      throw err;
    }

    const [violations] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM traffic_violations WHERE plate_number = ? AND violation_status != 'Paid'",
      [plate_number],
    );
    if (violations[0] && violations[0].count > 0) {
      const err = new Error(
        `Cannot delete vehicle. Vehicle has ${violations[0].count} outstanding traffic violations in the database. Please resolve or delete the violations first.`,
      );
      (err as any).code = "ER_ROW_IS_REFERENCED";
      throw err;
    }

    await connection.query(
      "DELETE FROM traffic_violations WHERE plate_number = ? AND violation_status = 'Paid'",
      [plate_number]
    );

    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM vehicles WHERE plate_number=?",
      [plate_number],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return plate_number;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const filterVehicleByDriver = async (driverFilter: DriverFilter) => {
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
    min_year: "v.year >= ?",
    max_year: "v.year <= ?",
  };

  const vehicleFields = [
    "plate_number",
    "engine_number",
    "chassis_number",
    "vehicle_type",
    "make",
    "model",
    "color",
    "license_number",
  ];
  const likeFields = ["make", "model", "color"];

  Object.entries(driverFilter).forEach(([key, value]) => {
    if (!value) return;

    if (vehicleFields.includes(key)) {
      if (likeFields.includes(key)) {
        conditions.push(`v.${key} LIKE ?`);
        params.push(`%${value}%`);
      } else {
        conditions.push(`v.${key} = ?`);
        params.push(value);
      }
    } else {
      conditions.push(mapping[key] || `d.${key} = ?`);
      params.push(key === "address" ? `%${value}%` : value);
    }
  });

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [result] = await connection.query(
      `SELECT v.*, d.full_name AS owner_name FROM vehicles v INNER JOIN drivers d ON v.license_number = d.license_number ${whereClause}`,
      params,
    );

    return result as Vehicle[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};
