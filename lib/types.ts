export type ProjectStatus = "idea" | "in_progress" | "deployed" | "paused";
export type ServiceKind = "frontend" | "backend" | "database" | "domain" | "other";
export type TodoPriority = "low" | "med" | "high";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  vault_verifier: Record<string, unknown> | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  stack: string[];
  repo_url: string | null;
  live_url: string | null;
  notes: string | null;
  logo_url?: string | null;
  accent: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  project_id: string;
  user_id: string;
  kind: ServiceKind;
  custom_kind: string | null;
  platform: string;
  login_email: string;
  created_at: string;
}

export interface Todo {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  done: boolean;
  priority: TodoPriority | null;
  due_date: string | null;
  created_at: string;
}

export interface EnvFile {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  label: string | null;
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  version: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  project_id: string | null;
  action: string;
  summary: string;
  created_at: string;
}

/** Project with its related services and todos loaded */
export interface ProjectWithRelations extends Project {
  services?: Service[];
  todos?: Todo[];
  env_files?: EnvFile[];
}

export interface DashboardProject extends Project {
  services: Service[];
  todos: Pick<Todo, 'id' | 'done' | 'due_date'>[];
  env_files: Pick<EnvFile, 'id'>[];
}

/** Accent color options for projects */
export const PROJECT_ACCENTS = [
  { label: "Pink", value: "pink", class: "bg-project-pink", hex: "#FFC3E3" },
  { label: "Blue", value: "blue", class: "bg-project-blue", hex: "#CDEEFB" },
  { label: "Indigo", value: "indigo", class: "bg-accent-primary", hex: "#5B3FD1" },
  { label: "Orange", value: "orange", class: "bg-accent-secondary", hex: "#FF7A2F" },
] as const;

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  in_progress: "In progress",
  deployed: "Deployed",
  paused: "Paused",
};

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  frontend: "Frontend host",
  backend: "Backend host",
  database: "Database",
  domain: "Domain",
  other: "Other",
};

export const PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: "Low",
  med: "Medium",
  high: "High",
};

