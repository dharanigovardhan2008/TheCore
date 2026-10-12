import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["idea", "in_progress", "deployed", "paused"]),
  stack: z.array(z.string().max(30)).max(20).default([]),
  repo_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  live_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().max(10000).optional().nullable(),
  accent: z.string().max(20).optional().nullable(),
  archived_at: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const serviceSchema = z.object({
  project_id: z.string().uuid(),
  kind: z.enum(["frontend", "backend", "database", "domain", "other"]),
  custom_kind: z.string().max(40, "Max 40 characters").optional().nullable(),
  platform: z.string().min(1, "Platform is required").max(100),
  login_email: z.string().email("Must be a valid email").max(255),
}).refine(data => {
  if (data.kind === "other" && (!data.custom_kind || data.custom_kind.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Type name is required when 'Other' is selected",
  path: ["custom_kind"]
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export const todoSchema = z.object({
  project_id: z.string().uuid(),
  text: z.string().min(1, "Task text is required").max(500),
  done: z.boolean().default(false),
  priority: z.enum(["low", "med", "high"]).optional().nullable(),
  due_date: z.string().optional().nullable(),
});

export type TodoFormData = z.infer<typeof todoSchema>;

