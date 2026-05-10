const { z } = require("zod");

const createServerSchema = z.object({
  name: z
    .string({ required_error: "Server name is required" })
    .min(1, "Server name cannot be empty")
    .max(100, "Server name cannot exceed 100 characters")
    .trim(),

  iconUrl: z.string().url("Invalid icon URL").optional().nullable(),
});

const updateServerSchema = z.object({
  name: z
    .string()
    .min(1, "Server name cannot be empty")
    .max(100, "Server name cannot exceed 100 characters")
    .trim()
    .optional(),

  iconUrl: z.string().url("Invalid icon URL").optional().nullable(),
});

const createChannelSchema = z.object({
  name: z
    .string({ required_error: "Channel name is required" })
    .min(1, "Channel name cannot be empty")
    .max(50, "Channel name cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Channel name can only contain lowercase letters, numbers, and hyphens")
    .trim(),
  type: z.enum(["text", "voice"]).optional().default("text"),
});

const postMessageSchema = z.object({
  content:        z.string().max(2000, "Message cannot exceed 2000 characters").optional(),
  attachmentUrl:  z.string().url("Invalid attachment URL").optional().nullable(),
  attachmentName: z.string().max(255).optional().nullable(),
  attachmentSize: z.number().int().nonnegative().optional().nullable(),
  attachmentType: z.enum(["image", "video", "raw"]).optional().nullable(),
}).refine(
  (data) => (data.content && data.content.trim().length > 0) || data.attachmentUrl,
  { message: "Message must have content or an attachment" }
);

module.exports = {
  createServerSchema,
  updateServerSchema,
  createChannelSchema,
  postMessageSchema,
};
