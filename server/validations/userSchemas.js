const { z } = require("zod");

const signupSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),

  dob: z
    .string({ required_error: "Date of birth is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth"),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

const updateUserSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),

  email: z.string().email("Invalid email address").optional(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long")
    .optional(),

  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth")
    .optional(),

  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
});

module.exports = { signupSchema, loginSchema, updateUserSchema };
