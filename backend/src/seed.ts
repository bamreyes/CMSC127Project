import pool from "./config/db";
import { setupTrigger } from "./features/registrations/registration.trigger";
import { setupDriverTrigger } from "./features/drivers/driver.trigger";

export async function initializeDatabase(populate: boolean = false) {
  const connection = await pool.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    await connection.query("DROP TABLE IF EXISTS traffic_violations;");
    await connection.query("DROP TABLE IF EXISTS vehicle_registrations;");
    await connection.query("DROP TABLE IF EXISTS vehicles;");
    await connection.query("DROP TABLE IF EXISTS drivers;");

    await connection.query(`
      CREATE TABLE drivers (
        license_number varchar(50) NOT NULL,
        full_name varchar(255) NOT NULL,
        date_of_birth date NOT NULL,
        sex varchar(10) DEFAULT NULL,
        address text DEFAULT NULL,
        license_type varchar(50) DEFAULT NULL,
        license_status varchar(20) DEFAULT NULL,
        issued_at date DEFAULT NULL,
        expires_at date DEFAULT NULL,
        PRIMARY KEY (license_number)
      )
    `);

    await connection.query(`
      CREATE TABLE vehicles (
        plate_number varchar(20) NOT NULL,
        engine_number varchar(50) NOT NULL,
        chassis_number varchar(50) NOT NULL,
        vehicle_type varchar(50) DEFAULT NULL,
        make varchar(50) DEFAULT NULL,
        model varchar(50) DEFAULT NULL,
        year int(11) DEFAULT NULL,
        color varchar(30) DEFAULT NULL,
        license_number varchar(50) DEFAULT NULL,
        PRIMARY KEY (plate_number),
        UNIQUE KEY engine_number (engine_number),
        UNIQUE KEY chassis_number (chassis_number),
        KEY fk_vehicles_drivers (license_number),
        CONSTRAINT fk_vehicles_drivers FOREIGN KEY (license_number) REFERENCES drivers (license_number) ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE vehicle_registrations (
        registration_number bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        registration_status varchar(20) DEFAULT NULL,
        registration_date date DEFAULT NULL,
        expiration_date date DEFAULT NULL,
        plate_number varchar(20) NOT NULL,
        license_number varchar(50) DEFAULT NULL,
        active_plate_number varchar(20) GENERATED ALWAYS AS (
          IF(registration_status = 'Active', plate_number, NULL)
        ) VIRTUAL,
        PRIMARY KEY (registration_number),
        KEY idx_plate_number (plate_number),
        KEY fk_reg_drivers (license_number),
        UNIQUE KEY unique_active_registration (active_plate_number),
        CONSTRAINT fk_reg_vehicles FOREIGN KEY (plate_number) REFERENCES vehicles (plate_number) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_reg_drivers FOREIGN KEY (license_number) REFERENCES drivers (license_number) ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE traffic_violations (
        violation_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        date date NOT NULL,
        location varchar(255) DEFAULT NULL,
        fine_amount decimal(10,2) DEFAULT NULL,
        apprehending_officer varchar(255) DEFAULT NULL,
        violation_status varchar(20) DEFAULT NULL,
        violation_type varchar(100) DEFAULT NULL,
        license_number varchar(50) DEFAULT NULL,
        plate_number varchar(20) DEFAULT NULL,
        PRIMARY KEY (violation_id),
        KEY license_number (license_number),
        KEY plate_number (plate_number),
        CONSTRAINT fk_tv_driver FOREIGN KEY (license_number) REFERENCES drivers (license_number) ON DELETE RESTRICT,
        CONSTRAINT fk_tv_vehicle FOREIGN KEY (plate_number) REFERENCES vehicles (plate_number) ON DELETE RESTRICT
      )
    `);

    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    await setupTrigger();
    await setupDriverTrigger();

    if (populate) {
      const drivers = [
        ['LTO-TX-001', 'Juan Dela Cruz', '1985-05-15', 'Male', '123 Rizal St, Manila', 'Professional', 'Valid', '2020-01-15', '2025-01-15'],
        ['LTO-TX-002', 'Maria Clara', '1990-08-22', 'Female', '456 Bonifacio Ave, Quezon City', 'Non-Professional', 'Valid', '2021-03-10', '2026-03-10'],
        ['LTO-TX-003', 'Andres Bonifacio', '1988-11-30', 'Male', '789 Mabini St, Caloocan', 'Professional', 'Suspended', '2019-07-20', '2024-07-20'],
        ['LTO-TX-004', 'Jose Rizal', '1992-06-19', 'Male', '101 Luna St, Makati', 'Non-Professional', 'Valid', '2022-02-14', '2027-02-14'],
        ['LTO-TX-005', 'Gabriela Silang', '1995-03-08', 'Female', '202 Aguinaldo Highway, Cavite', 'Professional', 'Expired', '2018-05-05', '2023-05-05'],
        ['LTO-TX-006', 'Emilio Aguinaldo', '1980-03-22', 'Male', '10 Kawit, Cavite', 'Professional', 'Valid', '2020-10-10', '2025-10-10'],
        ['LTO-TX-007', 'Melchora Aquino', '1965-01-06', 'Female', '55 Tandang Sora, Quezon City', 'Non-Professional', 'Valid', '2021-04-12', '2026-04-12'],
        ['LTO-TX-008', 'Apolinario Mabini', '1987-07-23', 'Male', '32 Tanauan, Batangas', 'Professional', 'Suspended', '2021-09-15', '2026-09-15'],
        ['LTO-TX-009', 'Marcelo H. Del Pilar', '1983-08-30', 'Male', '88 Bulakan, Bulacan', 'Non-Professional', 'Valid', '2022-05-20', '2027-05-20'],
        ['LTO-TX-010', 'Antonio Luna', '1989-10-29', 'Male', '14 Binondo, Manila', 'Professional', 'Valid', '2022-01-10', '2027-01-10'],
        ['LTO-TX-011', 'Gregoria de Jesus', '1993-05-09', 'Female', '77 Caloocan City', 'Non-Professional', 'Valid', '2023-03-15', '2028-03-15'],
        ['LTO-TX-012', 'Juan Luna', '1984-10-23', 'Male', '99 Badoc, Ilocos Norte', 'Professional', 'Expired', '2017-11-20', '2022-11-20'],
        ['LTO-TX-013', 'Teresa Magbanua', '1991-10-13', 'Female', '12 Pototan, Iloilo', 'Professional', 'Valid', '2021-08-05', '2026-08-05'],
        ['LTO-TX-014', 'Macario Sakay', '1986-03-01', 'Male', '8 Tondo, Manila', 'Non-Professional', 'Suspended', '2022-07-12', '2027-07-12'],
        ['LTO-TX-015', 'Josefa Llanes Escoda', '1996-09-20', 'Female', '45 Dingras, Ilocos Norte', 'Non-Professional', 'Valid', '2023-06-01', '2028-06-01'],
      ];

      for (const d of drivers) {
        await connection.query(
          "INSERT INTO drivers (license_number, full_name, date_of_birth, sex, address, license_type, license_status, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          d
        );
      }

      const vehicles = [
        ['ABC-1234', 'ENG-1001', 'CHAS-2001', 'SUV', 'Toyota', 'Fortuner', 2020, 'Black', 'LTO-TX-001'],
        ['XYZ-9876', 'ENG-1002', 'CHAS-2002', 'Sedan', 'Honda', 'Civic', 2019, 'White', 'LTO-TX-002'],
        ['DEF-4567', 'ENG-1003', 'CHAS-2003', 'Truck', 'Isuzu', 'Elf', 2015, 'Red', 'LTO-TX-003'],
        ['LMN-3456', 'ENG-1004', 'CHAS-2004', 'Motorcycle', 'Yamaha', 'Mio', 2021, 'Blue', 'LTO-TX-004'],
        ['PQR-7890', 'ENG-1005', 'CHAS-2005', 'Van', 'Nissan', 'Urvan', 2018, 'Silver', 'LTO-TX-001'],
        ['UVW-1111', 'ENG-1006', 'CHAS-2006', 'Sedan', 'Toyota', 'Vios', 2021, 'Gray', 'LTO-TX-006'],
        ['GHI-2222', 'ENG-1007', 'CHAS-2007', 'SUV', 'Mitsubishi', 'Montero', 2022, 'Black', 'LTO-TX-007'],
        ['JKL-3333', 'ENG-1008', 'CHAS-2008', 'Hatchback', 'Hyundai', 'Eon', 2017, 'Red', 'LTO-TX-008'],
        ['MNO-4444', 'ENG-1009', 'CHAS-2009', 'SUV', 'Ford', 'Everest', 2020, 'Blue', 'LTO-TX-009'],
        ['STU-5555', 'ENG-1010', 'CHAS-2010', 'Pickup', 'Toyota', 'Hilux', 2023, 'White', 'LTO-TX-010'],
        ['VWX-6666', 'ENG-1011', 'CHAS-2011', 'Sedan', 'Mazda', '3', 2021, 'Soul Red', 'LTO-TX-011'],
        ['YZA-7777', 'ENG-1012', 'CHAS-2012', 'Van', 'Toyota', 'Hiace', 2019, 'Gold', 'LTO-TX-012'],
        ['BCD-8888', 'ENG-1013', 'CHAS-2013', 'SUV', 'Honda', 'CR-V', 2022, 'Silver', 'LTO-TX-013'],
        ['EFG-9999', 'ENG-1014', 'CHAS-2014', 'Motorcycle', 'Honda', 'Click', 2022, 'Black', 'LTO-TX-014'],
        ['HIJ-0000', 'ENG-1015', 'CHAS-2015', 'Sedan', 'Hyundai', 'Accent', 2018, 'White', 'LTO-TX-015'],
      ];

      for (const v of vehicles) {
        await connection.query(
          "INSERT INTO vehicles (plate_number, engine_number, chassis_number, vehicle_type, make, model, year, color, license_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          v
        );
      }

      const registrations = [
        ['Active', '2023-01-10', '2024-01-10', 'ABC-1234', 'LTO-TX-001'],
        ['Active', '2023-05-15', '2024-05-15', 'XYZ-9876', 'LTO-TX-002'],
        ['Expired', '2022-08-20', '2023-08-20', 'DEF-4567', 'LTO-TX-003'],
        ['Active', '2023-11-05', '2024-11-05', 'LMN-3456', 'LTO-TX-004'],
        ['Active', '2023-02-28', '2024-02-28', 'PQR-7890', 'LTO-TX-001'],
        ['Active', '2024-10-15', '2025-10-15', 'UVW-1111', 'LTO-TX-006'],
        ['Active', '2025-02-20', '2026-02-20', 'GHI-2222', 'LTO-TX-007'],
        ['Expired', '2022-04-10', '2023-04-10', 'JKL-3333', 'LTO-TX-008'],
        ['Active', '2023-09-01', '2024-09-01', 'MNO-4444', 'LTO-TX-009'],
        ['Active', '2024-03-25', '2025-03-25', 'STU-5555', 'LTO-TX-010'],
        ['Active', '2023-07-12', '2024-07-12', 'VWX-6666', 'LTO-TX-011'],
        ['Expired', '2021-12-05', '2022-12-05', 'YZA-7777', 'LTO-TX-012'],
        ['Active', '2025-05-18', '2026-05-18', 'BCD-8888', 'LTO-TX-013'],
        ['Expired', '2022-10-01', '2023-10-01', 'EFG-9999', 'LTO-TX-014'],
        ['Active', '2023-08-14', '2024-08-14', 'HIJ-0000', 'LTO-TX-015'],
      ];

      for (const r of registrations) {
        await connection.query(
          "INSERT INTO vehicle_registrations (registration_status, registration_date, expiration_date, plate_number, license_number) VALUES (?, ?, ?, ?, ?)",
          r
        );
      }

      const violations = [
        ['2022-03-15', 'EDSA, Quezon City', 1500.00, 'Officer Santos', 'Unpaid', 'Speeding', 'LTO-TX-001', 'ABC-1234'],
        ['2022-09-22', 'C5 Road, Pasig', 1000.00, 'Officer Reyes', 'Paid', 'Beating the Red Light', 'LTO-TX-003', 'DEF-4567'],
        ['2023-01-05', 'Makati Ave, Makati', 500.00, 'Officer Cruz', 'Unpaid', 'Illegal Parking', 'LTO-TX-002', 'XYZ-9876'],
        ['2023-05-12', 'Roxas Blvd, Manila', 2000.00, 'Officer Garcia', 'Paid', 'Reckless Driving', 'LTO-TX-004', 'LMN-3456'],
        ['2023-11-01', 'Commonwealth Ave, QC', 1500.00, 'Officer Santos', 'Unpaid', 'Speeding', 'LTO-TX-001', 'PQR-7890'],
        ['2024-02-18', 'Aurora Blvd, QC', 1500.00, 'Officer Santos', 'Unpaid', 'No Helmet', 'LTO-TX-004', 'LMN-3456'],
        ['2024-06-25', 'Shaw Blvd, Mandaluyong', 1000.00, 'Officer Reyes', 'Paid', 'Coding Violation', 'LTO-TX-006', 'UVW-1111'],
        ['2024-09-30', 'EDSA, Makati', 2000.00, 'Officer Cruz', 'Unpaid', 'Reckless Driving', 'LTO-TX-008', 'JKL-3333'],
        ['2024-11-15', 'Taft Ave, Manila', 500.00, 'Officer Garcia', 'Paid', 'Illegal U-Turn', 'LTO-TX-009', 'MNO-4444'],
        ['2025-01-20', 'Katipunan Ave, QC', 1000.00, 'Officer Reyes', 'Unpaid', 'Obstruction', 'LTO-TX-010', 'STU-5555'],
        ['2025-04-12', 'EDSA, Pasay', 1500.00, 'Officer Santos', 'Paid', 'Speeding', 'LTO-TX-011', 'VWX-6666'],
        ['2025-08-05', 'Quirino Highway, Caloocan', 3000.00, 'Officer Cruz', 'Unpaid', 'Overloading', 'LTO-TX-012', 'YZA-7777'],
        ['2025-12-10', 'Buendia Ave, Makati', 1000.00, 'Officer Garcia', 'Unpaid', 'Beating the Red Light', 'LTO-TX-013', 'BCD-8888'],
        ['2026-02-14', 'Macapagal Blvd, Pasay', 1500.00, 'Officer Santos', 'Paid', 'Speeding', 'LTO-TX-015', 'HIJ-0000'],
        ['2026-04-05', 'Commonwealth Ave, QC', 3000.00, 'Officer Reyes', 'Unpaid', 'Driving Without License', 'LTO-TX-014', 'EFG-9999'],
      ];

      for (const v of violations) {
        await connection.query(
          "INSERT INTO traffic_violations (date, location, fine_amount, apprehending_officer, violation_status, violation_type, license_number, plate_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          v
        );
      }

      console.log("Database initialized and populated successfully.");
    } else {
      console.log("Database initialized successfully (empty schema).");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  const populate = !process.argv.includes("--no-populate");
  initializeDatabase(populate)
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
