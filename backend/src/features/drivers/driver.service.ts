import pool from "@/config/db";
import { Driver } from "@shared";
import { DriverFilter } from "@shared";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const syncDriverStatuses = async (connection: any) => {
  await connection.query(
    "UPDATE drivers SET license_status = 'Expired' WHERE expires_at <= CURDATE() AND license_status != 'Expired'",
  );

  // Suspend all drivers who have unpaid violations that are more than 15 days old and are not expired
  await connection.query(
    `UPDATE drivers d
     SET d.license_status = 'Suspended'
     WHERE d.expires_at > CURDATE()
       AND d.license_status != 'Suspended'
       AND (SELECT COUNT(*) FROM traffic_violations tv 
            WHERE tv.license_number = d.license_number 
              AND tv.violation_status = 'Unpaid'
              AND tv.date < DATE_SUB(CURDATE(), INTERVAL 15 DAY)) > 0`,
  );

  // Activate all drivers who are suspended, but have no unpaid violations that are more than 15 days old and are unexpired
  await connection.query(
    `UPDATE drivers d
     SET d.license_status = 'Valid'
     WHERE d.expires_at > CURDATE()
       AND d.license_status = 'Suspended'
       AND (SELECT COUNT(*) FROM traffic_violations tv 
            WHERE tv.license_number = d.license_number 
              AND tv.violation_status = 'Unpaid'
              AND tv.date < DATE_SUB(CURDATE(), INTERVAL 15 DAY)) = 0`,
  );
};

export const getAllDrivers = async () => {
  const connection = await pool.getConnection();
  try {
    await syncDriverStatuses(connection);
    const [result] = (await connection.query(
      "SELECT * FROM drivers",
    )) as any as [Driver[], any];
    return result;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const getDriver = async (license_number: string) => {
  const connection = await pool.getConnection();
  try {
    await syncDriverStatuses(connection);
    const [result] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [license_number],
    );
    return result[0] as Driver;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const createDriver = async (driver: Driver) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO drivers (license_number, full_name, date_of_birth, sex, address, license_type, license_status, issued_at, expires_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        driver.license_number,
        driver.full_name,
        driver.date_of_birth,
        driver.sex,
        driver.address,
        driver.license_type,
        driver.license_status,
        driver.issued_at,
        driver.expires_at,
      ],
    );

    await syncDriverStatuses(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [driver.license_number],
    );
    return rows[0] as Driver;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const updateDriver = async (driver: Driver) => {
  const connection = await pool.getConnection();
  try {
    const [unpaidViolations] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM traffic_violations WHERE license_number = ? AND violation_status = 'Unpaid'",
      [driver.license_number],
    );

    let resolvedStatus = driver.license_status;
    if (unpaidViolations[0] && unpaidViolations[0].count > 0) {
      const isExpired =
        new Date(driver.expires_at).getTime() <=
        new Date().setHours(0, 0, 0, 0);
      if (isExpired) {
        resolvedStatus = "Expired"; // Expired conquers Suspended
      } else {
        resolvedStatus = "Suspended";
      }
    }

    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE drivers SET full_name=?, date_of_birth=?, sex=?, address=?, license_type=?, license_status=?, issued_at=?, expires_at=? WHERE license_number=?",
      [
        driver.full_name,
        driver.date_of_birth,
        driver.sex,
        driver.address,
        driver.license_type,
        resolvedStatus,
        driver.issued_at,
        driver.expires_at,
        driver.license_number,
      ],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    await syncDriverStatuses(connection);

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM drivers WHERE license_number = ?",
      [driver.license_number],
    );
    return rows[0] as Driver;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteDriver = async (license_number: string) => {
  const connection = await pool.getConnection();
  try {
    const [vehicles] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM vehicles WHERE license_number = ?",
      [license_number],
    );
    if (vehicles[0] && vehicles[0].count > 0) {
      const err = new Error(
        `Cannot delete driver. Driver currently owns ${vehicles[0].count} registered vehicle(s) in the database. Please reassign or delete the vehicles first.`,
      );
      (err as any).code = "ER_ROW_IS_REFERENCED";
      throw err;
    }

    const [violations] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM traffic_violations WHERE license_number = ? AND violation_status != 'Paid'",
      [license_number],
    );
    if (violations[0] && violations[0].count > 0) {
      const err = new Error(
        `Cannot delete driver. Driver has ${violations[0].count} outstanding traffic violations in the database. Please resolve or delete the violations first.`,
      );
      (err as any).code = "ER_ROW_IS_REFERENCED";
      throw err;
    }

    await connection.query(
      "DELETE FROM traffic_violations WHERE license_number = ? AND violation_status = 'Paid'",
      [license_number],
    );

    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM drivers WHERE license_number=?",
      [license_number],
    );

    if (result.affectedRows == 0) {
      return null;
    }

    return license_number;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

export const filterDriver = async ({
  sex,
  license_type,
  license_status,
  min_bdate,
  max_bdate,
  address,
  license_number,
  full_name,
  min_age,
  max_age,
}: DriverFilter) => {
  const connection = await pool.getConnection();
  try {
    const conditions = [];
    const params = [];

    if (license_type) {
      conditions.push("license_type = ?");
      params.push(license_type);
    }
    if (license_status) {
      if (license_status.includes(",")) {
        const statuses = license_status.split(",");
        const placeholders = statuses.map(() => "?").join(", ");
        conditions.push(`license_status IN (${placeholders})`);
        params.push(...statuses);
      } else {
        conditions.push("license_status = ?");
        params.push(license_status);
      }
    }
    if (min_bdate) {
      conditions.push("date_of_birth >= ?");
      params.push(min_bdate);
    }
    if (max_bdate) {
      conditions.push("date_of_birth <= ?");
      params.push(max_bdate);
    }
    if (sex) {
      conditions.push("sex = ?");
      params.push(sex);
    }
    if (address) {
      conditions.push("address LIKE ?");
      params.push(`%${address}%`);
    }
    if (license_number) {
      conditions.push("license_number LIKE ?");
      params.push(`%${license_number}%`);
    }
    if (full_name) {
      conditions.push("full_name LIKE ?");
      params.push(`%${full_name}%`);
    }
    if (min_age) {
      const today = new Date();
      const maxBdate = new Date(today.getFullYear() - min_age, today.getMonth(), today.getDate());
      conditions.push("date_of_birth <= ?");
      params.push(maxBdate);
    }
    if (max_age) {
      const today = new Date();
      const minBdate = new Date(today.getFullYear() - max_age - 1, today.getMonth(), today.getDate() + 1);
      conditions.push("date_of_birth >= ?");
      params.push(minBdate);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [result] = await connection.query(
      `SELECT * FROM (
        SELECT d.license_number, d.full_name, d.date_of_birth, d.sex, d.address, d.license_type,
               CASE 
                 WHEN d.expires_at <= CURDATE() THEN 'Expired'
                 WHEN (SELECT COUNT(*) FROM traffic_violations tv WHERE tv.license_number = d.license_number AND tv.violation_status = 'Unpaid') > 0 THEN 'Suspended'
                 ELSE d.license_status
               END AS license_status,
               d.issued_at, d.expires_at 
        FROM drivers d
      ) AS resolved_drivers ${where}`,
      params,
    );

    return result as Driver[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};
