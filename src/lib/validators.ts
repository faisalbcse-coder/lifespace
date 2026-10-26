import { z } from "zod";
import { parseDateKey } from "./dates";

export const DateKeySchema = z
  .string()
  .refine((v) => parseDateKey(v) !== null, "Date must be a valid YYYY-MM-DD string");

export const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters"),
  name: z.string().trim().max(100, "Name cannot exceed 100 characters").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const SectionKindEnum = z.enum(["TASK", "GOAL"]);

export const CreateSectionSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(100, "Name cannot exceed 100 characters"),
  color: z.string().trim().max(50).default("indigo"),
  type: SectionKindEnum.optional(),
});

export const UpdateSectionSchema = z.object({
  name: z.string().trim().min(1, "Section name cannot be empty").max(100).optional(),
  color: z.string().trim().max(50).optional(),
  type: SectionKindEnum.optional(),
  collapsed: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

export const ReorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1, "Must provide at least one section ID"),
});

export const SectionItemStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const SectionItemPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const SectionItemTypeEnum = z.enum(["TASK", "NOTE", "PROJECT", "HABIT", "SKILL", "GOAL"]);

export const CreateItemSchema = z.object({
  sectionId: z.string().min(1, "Section ID is required"),
  title: z.string().trim().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().nullable(),
  status: SectionItemStatusEnum.default("TODO"),
  priority: SectionItemPriorityEnum.default("MEDIUM"),
  itemType: SectionItemTypeEnum.default("TASK"),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  metadata: z.string().max(10000).optional().nullable(),
  scheduledDate: DateKeySchema.optional().nullable(),
});

export const UpdateItemSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(255).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: SectionItemStatusEnum.optional(),
  priority: SectionItemPriorityEnum.optional(),
  itemType: SectionItemTypeEnum.optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")).or(z.null()),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  metadata: z.string().max(10000).optional().nullable(),
  sectionId: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
  content: z.string().max(500000, "Notes cannot exceed 500,000 characters").optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  scheduledDate: DateKeySchema.optional().nullable(),
});

export const CreateSubTaskSchema = z.object({
  title: z.string().trim().min(1, "Sub-task title is required").max(255),
});

export const UpdateSubTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  isCompleted: z.boolean().optional(),
});

export const CreateSubGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const UpdateSubGoalSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(255).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  collapsed: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const CreateSubGoalTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(255, "Title cannot exceed 255 characters"),
  scheduledDate: DateKeySchema.optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const CreateLinkAttachmentSchema = z.object({
  type: z.literal("LINK"),
  title: z.string().trim().min(1, "Link title is required").max(255),
  url: z
    .string()
    .trim()
    .max(2048)
    .url("Must be a valid URL")
    .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed"),
});

export const CreateLogSchema = z.object({
  note: z.string().trim().min(1, "Log note is required").max(5000),
  progressSnapshot: z.number().int().min(0).max(100).optional().nullable(),
});

export const ScheduleItemSchema = z
  .object({
    scheduledDate: DateKeySchema.nullable().optional(),
    preset: z.enum(["tomorrow", "nextWeek", "today"]).optional(),
  })
  .refine(
    (v) => v.scheduledDate !== undefined || v.preset !== undefined,
    "Provide either scheduledDate or preset"
  );

export const ReorderItemsSchema = z.object({
  sectionId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).min(1),
});

export const UserPreferenceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  density: z.enum(["compact", "comfortable"]).optional(),
  showArchived: z.boolean().optional(),
  seeMoreExpanded: z.boolean().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().max(100, "Name cannot exceed 100 characters").optional().nullable(),
  fatherName: z.string().trim().max(100).optional().nullable(),
  motherName: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  permanentAddress: z.string().trim().max(255).optional().nullable(),
  dateOfBirth: z.string().trim().max(50).optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  bloodGroup: z.string().trim().max(20).optional().nullable(),
  occupation: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  emergencyContact: z.string().trim().max(100).optional().nullable(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


