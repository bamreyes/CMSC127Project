import pool from "../../config/db";

export async function setupDriverTrigger() {
  try {
    await pool.query(`DROP TRIGGER IF EXISTS set_driver_status_expired`);
    await pool.query(`CREATE TRIGGER set_driver_status_expired
                          BEFORE UPDATE ON drivers
                          FOR EACH ROW
                          BEGIN
                               DECLARE unpaid_count INT DEFAULT 0;
                               IF NEW.expires_at <= CURDATE() 
                               THEN SET NEW.license_status = 'Expired';
                               ELSE
                                    SELECT COUNT(*) INTO unpaid_count 
                                    FROM traffic_violations 
                                    WHERE license_number = NEW.license_number 
                                      AND violation_status = 'Unpaid' 
                                      AND date < DATE_SUB(CURDATE(), INTERVAL 15 DAY);
                                      
                                    IF unpaid_count > 0 THEN
                                        SET NEW.license_status = 'Suspended';
                                    ELSE
                                        SET NEW.license_status = 'Valid';
                                    END IF;
                               END IF;
                           END;`);

    await pool.query(`DROP TRIGGER IF EXISTS set_driver_status_expired_insert`);
    await pool.query(`CREATE TRIGGER set_driver_status_expired_insert
                          BEFORE INSERT ON drivers
                          FOR EACH ROW
                          BEGIN
                               DECLARE unpaid_count INT DEFAULT 0;
                               IF NEW.expires_at <= CURDATE() 
                               THEN SET NEW.license_status = 'Expired';
                               ELSE
                                    SELECT COUNT(*) INTO unpaid_count 
                                    FROM traffic_violations 
                                    WHERE license_number = NEW.license_number 
                                      AND violation_status = 'Unpaid' 
                                      AND date < DATE_SUB(CURDATE(), INTERVAL 15 DAY);
                                      
                                    IF unpaid_count > 0 THEN
                                        SET NEW.license_status = 'Suspended';
                                    ELSE
                                        SET NEW.license_status = 'Valid';
                                    END IF;
                               END IF;
                           END;`);

    console.log("Driver Trigger successful.");
  } catch (err) {
    console.error("A driver trigger error occurred:", err);
  }
}
