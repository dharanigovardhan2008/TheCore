"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Project } from "@/lib/types";
import { TodoFormData, todoSchema } from "@/lib/validations";
import clsx from "clsx";

interface NewTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSave: (data: TodoFormData) => Promise<void>;
  defaultProjectId?: string;
}

export default function NewTodoModal({ isOpen, onClose, projects, onSave, defaultProjectId }: NewTodoModalProps) {
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id || ""));
  const [priority, setPriority] = useState<"low" | "med" | "high" | "">("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const formData = {
      project_id: projectId,
      text,
      priority: priority || null,
      due_date: dueDate || null,
      done: false,
    };

    const result = todoSchema.safeParse(formData);
    if (!result.success) {
      const formErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          formErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(result.data);
      setText("");
      setPriority("");
      setDueDate("");
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-[var(--radius-shell)] p-6 shadow-xl border border-surface-tint">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-content">Add New To-do</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-tint rounded-full text-content-hint transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1">Task</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={clsx(
                "w-full px-4 py-2 bg-white border rounded-[var(--radius-btn)] text-content focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.text ? "border-red-500" : "border-[#DCE9E3]"
              )}
              placeholder="What needs to be done?"
              maxLength={200}
            />
            {errors.text && <p className="text-red-500 text-xs mt-1">{errors.text}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={clsx(
                "w-full px-4 py-2 bg-white border rounded-[var(--radius-btn)] text-content focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.project_id ? "border-red-500" : "border-[#DCE9E3]"
              )}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project_id && <p className="text-red-500 text-xs mt-1">{errors.project_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 bg-white border border-[#DCE9E3] rounded-[var(--radius-btn)] text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-content mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#DCE9E3] rounded-[var(--radius-btn)] text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content-secondary hover:text-content"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-accent-primary text-white text-sm font-medium rounded-[var(--radius-btn)] hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add To-do"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
