import { z } from "zod";

/**
 * Zod validation schemas for auth API requests.
 */

export const sendOtpSchema = z
  .object({
    type: z.enum(["email", "phone"], {
      required_error: "Type is required (email or phone)",
    }),
    identifier: z
      .string({ required_error: "Identifier is required" })
      .min(1, "Identifier cannot be empty"),
  })
  .refine(
    (data) => {
      if (data.type === "email") {
        return z.string().email().safeParse(data.identifier).success;
      }
      if (data.type === "phone") {
        // E.164 format: +<country_code><number>, 7-15 digits total
        return /^\+[1-9]\d{6,14}$/.test(data.identifier);
      }
      return false;
    },
    {
      message:
        "Invalid identifier. Provide a valid email or phone number in E.164 format (e.g. +919876543210)",
      path: ["identifier"],
    }
  );

export const verifyOtpSchema = z.object({
  type: z.enum(["email", "phone"], {
    required_error: "Type is required (email or phone)",
  }),
  identifier: z
    .string({ required_error: "Identifier is required" })
    .min(1, "Identifier cannot be empty"),
  otp: z
    .string({ required_error: "OTP is required" })
    .regex(/^\d+$/, "OTP must contain only digits")
    .min(4, "OTP must be at least 4 digits")
    .max(8, "OTP must be at most 8 digits"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});
