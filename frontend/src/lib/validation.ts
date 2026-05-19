import { z } from "zod";

export const driverSchema = z
  .object({
    license_number: z.string().trim().min(1, "License number is required"),
    full_name: z
      .string()
      .trim()
      .min(2, "Full name is required (min 2 characters)"),
    date_of_birth: z.date({
      message: "Birthdate is required",
    }),
    sex: z.enum(["M", "F"], {
      message: "Gender is required",
    }),
    address: z.string().trim().min(5, "Address is required (min 5 characters)"),
    license_type: z.string().min(1, "License type is required"),
    license_status: z.string().min(1, "License status is required"),
    issued_at: z.date({
      message: "Issue date is required",
    }),
    expires_at: z.date({
      message: "Expiry date is required",
    }),
  })
  .refine(
    (data) => {
      if (!data.issued_at || !data.expires_at) return true;
      return data.expires_at > data.issued_at;
    },
    {
      message: "Expiry date must be after the issue date",
      path: ["expires_at"],
    },
  )
  .refine(
    (data) => {
      if (!data.date_of_birth || !data.license_type) return true;
      
      const dob = new Date(data.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (data.license_type === "Student Permit" && age < 16) return false;
      if (data.license_type === "Non-Professional" && age < 17) return false;
      if (data.license_type === "Professional" && age < 18) return false;
      
      return true;
    },
    (data) => {
      const dob = new Date(data.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      let requiredAge = 16;
      if (data.license_type === "Non-Professional") requiredAge = 17;
      if (data.license_type === "Professional") requiredAge = 18;

      return {
        message: `${data.license_type} licenses require the driver to be at least ${requiredAge} years old (current age is ${age}).`,
        path: ["date_of_birth"],
      };
    }
  );

export const vehicleSchema = z.object({
  plate_number: z.string().trim().min(1, "Plate number is required"),
  license_number: z.string().trim().min(1, "Driver license number is required"),
  engine_number: z.string().trim().min(1, "Engine number is required"),
  chassis_number: z.string().trim().min(1, "Chassis number is required"),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z
    .union([
      z.number("Year must be a number"),
      z.string().min(1, "Year is required"),
    ])
    .transform((val) => {
      if (typeof val === "number") return val;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    })
    .pipe(
      z
        .number()
        .min(1886, "Year must be 1886 or later")
        .max(
          new Date().getFullYear() + 10,
          `Year cannot exceed ${new Date().getFullYear() + 10}`,
        ),
    ),
  vehicle_type: z.string().min(1, "Vehicle type is required"),
  color: z.string().trim().min(1, "Color is required"),
});

export const registrationSchema = z
  .object({
    registration_number: z
      .union([
        z.number("Registration number must be a number"),
        z.string().min(1, "Registration number is required"),
      ])
      .transform((val) => {
        if (typeof val === "number") return val;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
      })
      .pipe(z.number().positive("Registration number must be positive")),
    plate_number: z.string().trim().min(1, "Plate number is required"),
    registration_status: z.string().min(1, "Registration status is required"),
    registration_date: z.date({
      message: "Registration date is required",
    }),
    expiration_date: z.date({
      message: "Expiration date is required",
    }),
  })
  .refine(
    (data) => {
      if (!data.registration_date || !data.expiration_date) return true;
      return data.expiration_date > data.registration_date;
    },
    {
      message: "Expiration date must be after the registration date",
      path: ["expiration_date"],
    },
  );

export const violationSchema = z.object({
  date: z
    .date({
      message: "Violation date is required",
    })
    .refine((d) => d <= new Date(), {
      message: "Violation date cannot be in the future",
    }),
  license_number: z
    .string()
    .trim()
    .min(1, "Violator license number is required"),
  plate_number: z.string().trim().min(1, "Plate number is required"),
  location: z.string().trim().min(1, "Location is required"),
  violation_type: z.string().trim().min(1, "Violation type is required"),
  fine_amount: z
    .union([
      z.number("Fine amount must be a number"),
      z.string().min(1, "Fine amount is required"),
    ])
    .transform((val) => {
      if (typeof val === "number") return val;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
    .pipe(z.number().min(0, "Fine amount must be greater than or equal to 0")),
  apprehending_officer: z.string().trim().optional(),
  violation_status: z.string().min(1, "Violation status is required"),
});
