"use client";

import { useState, useRef } from "react";
import { Todo, Project } from "@/lib/types";
import { toggleTodo, deleteTodo, createTodo } from "@/app/dashboard/actions";
import { Check, Trash2, ChevronDown, ChevronRight, Calendar, Plus } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import NewTodoModal from "./NewTodoModal";
import { TodoFormData } from "@/lib/validations";

interface TodoWithProject extends Todo {
  projects?: { name: string } | null;
}

interface TodosClientProps {
  initialTodos: TodoWithProject[];
  projects: Project[];
}

type FilterType = "all" | "open" | "done";

export default function TodosClient({ initialTodos, projects }: TodosClientProps) {
  const [todos, setTodos] = useState<TodoWithProject[]>(initialTodos);
  const [filter, setFilter] = useState<FilterType>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"due_date" | "priority">("due_date");
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  
  // Phase 7 state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddProjectId, setQuickAddProjectId] = useState(projects[0]?.id || "");
  const [quickAddPriority, setQuickAddPriority] = useState<"low" | "med" | "high" | "">("");
  
  const [inlineAddProjectId, setInlineAddProjectId] = useState<string | null>(null);
  const [inlineAddText, setInlineAddText] = useState("");

  const [toastError, setToastError] = useState<string | null>(null);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 3000);
  };

  const handleToggle = async (todo: TodoWithProject) => {
    const originalTodos = [...todos];
    const updatedTodo = { ...todo, done: !todo.done };
    
    setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
    
    try {
      await toggleTodo(todo.id, updatedTodo.done);
    } catch (e) {
      setTodos(originalTodos);
      showError("Failed to update to-do");
    }
  };

  const handleDelete = async (id: string) => {
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    
    try {
      await deleteTodo(id);
    } catch (e) {
      setTodos(originalTodos);
      showError("Failed to delete to-do");
    }
  };

  const handleAdd = async (data: TodoFormData) => {
    const tempId = `temp-${Date.now()}`;
    const newTodo: TodoWithProject = {
      id: tempId,
      project_id: data.project_id,
      user_id: "optimistic",
      text: data.text,
      done: data.done || false,
      priority: data.priority || null,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      projects: { name: projects.find(p => p.id === data.project_id)?.name || "" },
    };

    const originalTodos = [...todos];
    setTodos([newTodo, ...todos]);

    try {
      const created = await createTodo(data);
      setTodos(prev => prev.map(t => t.id === tempId ? { ...created, projects: newTodo.projects } : t));
    } catch (e) {
      setTodos(originalTodos);
      showError("Failed to add to-do");
      throw e; // rethrow for modal
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    if (!quickAddProjectId) return;

    const data: TodoFormData = {
      project_id: quickAddProjectId,
      text: quickAddText,
      priority: quickAddPriority || null,
      done: false
    };

    try {
      await handleAdd(data);
      setQuickAddText("");
      // Keep focus on input
      quickAddInputRef.current?.focus();
    } catch (e) {
      // Error already handled
    }
  };

  const handleInlineAdd = async (pId: string) => {
    if (!inlineAddText.trim()) {
      setInlineAddProjectId(null);
      setInlineAddText("");
      return;
    }

    const data: TodoFormData = {
      project_id: pId,
      text: inlineAddText,
      done: false
    };

    try {
      await handleAdd(data);
      setInlineAddText("");
      setInlineAddProjectId(null);
    } catch (e) {
      // Error handled
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, pId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInlineAdd(pId);
    } else if (e.key === "Escape") {
      setInlineAddProjectId(null);
      setInlineAddText("");
    }
  };

  const getPriorityWeight = (p: string | null) => {
    if (p === "high") return 3;
    if (p === "med") return 2;
    if (p === "low") return 1;
    return 0;
  };


  const filteredTodos = todos.filter(t => {
    if (filter === "open" && t.done) return false;
    if (filter === "done" && !t.done) return false;
    if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === "priority") {
      const wA = getPriorityWeight(a.priority);
      const wB = getPriorityWeight(b.priority);
      if (wA !== wB) return wB - wA; // High to low
    }
    // Default or fallback: sort by due date
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return dateA - dateB;
  });

  // Group by project
  const grouped = sortedTodos.reduce((acc, todo) => {
    const pId = todo.project_id;
    if (!acc[pId]) acc[pId] = [];
    acc[pId].push(todo);
    return acc;
  }, {} as Record<string, TodoWithProject[]>);

  const toggleProject = (pId: string) => {
    const newCollapsed = new Set(collapsedProjects);
    if (newCollapsed.has(pId)) newCollapsed.delete(pId);
    else newCollapsed.add(pId);
    setCollapsedProjects(newCollapsed);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] transition-premium text-center">
        <h2 className="text-2xl font-bold text-content mb-4">No Projects Found</h2>
        <p className="text-content-secondary mb-8 max-w-md">
          Create a project first, then add to-dos to it to keep track of your tasks.
        </p>
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-accent-primary text-white font-medium rounded-[var(--radius-btn)] hover:bg-opacity-90 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const openCount = todos.filter(t => !t.done).length;
  const doneCount = todos.filter(t => t.done).length;
  const overdueCount = todos.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date()).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6 relative">
        {toastError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-[var(--radius-btn)] shadow-lg z-50 transition-opacity">
            {toastError}
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] truncate">To-dos</h1>
            <p className="text-[var(--text-secondary)] mt-1 truncate">Manage your tasks across projects.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white rounded-full font-semibold shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium"
          >
            <Plus className="w-4 h-4" />
            Add to-do
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden flex shrink-0 items-center justify-center w-12 h-12 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium"
            aria-label="Add to-do"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-surface p-2 rounded-[var(--radius-card)] shadow-[var(--shadow-card-soft)] border border-[var(--border-light)]">
          <input 
            ref={quickAddInputRef}
            type="text"
            value={quickAddText}
            onChange={e => setQuickAddText(e.target.value)}
            placeholder="Add a to-do and press Enter"
            className="flex-1 min-w-[200px] bg-page border border-surface-tint rounded-[var(--radius-btn)] px-4 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          />
          <select
            value={quickAddProjectId}
            onChange={e => setQuickAddProjectId(e.target.value)}
            className="bg-page border border-surface-tint rounded-[var(--radius-btn)] px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={quickAddPriority}
            onChange={e => setQuickAddPriority(e.target.value as any)}
            className="bg-page border border-surface-tint rounded-[var(--radius-btn)] px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          >
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
          <button 
            type="submit"
            disabled={!quickAddText.trim()}
            className="px-4 py-2 bg-accent-primary text-white rounded-[var(--radius-btn)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="flex bg-surface border border-[var(--border-light)] p-1 rounded-[var(--radius-card)] shadow-sm">
            {(["all", "open", "done"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex-1 sm:flex-none px-4 py-1.5 rounded-[var(--radius-btn)] text-sm font-medium capitalize transition-premium text-center",
                  filter === f ? "bg-[var(--bg-page)] text-[var(--color-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <select 
              value={projectFilter} 
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-sm bg-surface border border-[var(--border-light)] rounded-[var(--radius-card)] px-3 py-2 outline-none text-[var(--text-primary)] min-w-[120px] focus:border-gray-400 shadow-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm bg-surface border border-[var(--border-light)] rounded-[var(--radius-card)] px-3 py-2 outline-none text-[var(--text-primary)] min-w-[140px] focus:border-gray-400 shadow-sm"
            >
              <option value="due_date">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
        </div>

        {/* Todos List */}
        <div className="space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12 text-content-hint glass rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] transition-premium">
              No to-dos found for the selected filters.
            </div>
          ) : (
            Object.entries(grouped).map(([pId, projectTodos]) => {
              const project = projects.find(p => p.id === pId);
              const projectName = project?.name || projectTodos[0].projects?.name || "Unknown Project";
              const isCollapsed = collapsedProjects.has(pId);
              
              return (
                <div key={pId} className="glass rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] transition-premium overflow-hidden">
                  <button 
                    onClick={() => toggleProject(pId)}
                    className="w-full flex items-center gap-2 p-4 hover:bg-surface-tint/50 transition-colors text-left"
                  >
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-content-hint" /> : <ChevronDown className="w-5 h-5 text-content-hint" />}
                    <h3 className="text-lg font-semibold text-content">{projectName}</h3>
                    <span className="text-xs text-content-hint bg-surface-tint px-2 py-0.5 rounded-full ml-2">
                      {projectTodos.length}
                    </span>
                  </button>
                  
                  {!isCollapsed && (
                    <div className="p-4 pt-0 space-y-3">
                      {projectTodos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between group bg-page rounded-xl p-3 border border-transparent hover:border-surface-tint">
                          <div className="flex items-center gap-3 flex-1">
                            <button 
                              onClick={() => handleToggle(todo)}
                              className={clsx(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                todo.done ? "bg-accent-primary border-accent-primary text-white" : "border-content-hint hover:border-accent-primary"
                              )}
                            >
                              {todo.done && <Check className="w-3 h-3" />}
                            </button>
                            
                            <div className="flex flex-col">
                              <span className={clsx("text-sm", todo.done ? "text-content-hint line-through" : "text-content")}>
                                {todo.text}
                              </span>
                              {todo.due_date && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3 text-content-hint" />
                                  <span className={clsx("text-xs", new Date(todo.due_date) < new Date() && !todo.done ? "text-red-500 font-medium" : "text-content-hint")}>
                                    <span suppressHydrationWarning>{new Date(todo.due_date).toLocaleDateString()}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleDelete(todo.id)}
                              className="text-content-hint hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Inline Add */}
                      {inlineAddProjectId === pId ? (
                        <div className="flex items-center gap-3 pl-8 pr-3">
                          <input
                            autoFocus
                            type="text"
                            value={inlineAddText}
                            onChange={(e) => setInlineAddText(e.target.value)}
                            onKeyDown={(e) => handleInlineKeyDown(e, pId)}
                            onBlur={() => handleInlineAdd(pId)}
                            placeholder="Type and press Enter, Esc to cancel"
                            className="w-full bg-page border border-surface-tint rounded-[var(--radius-btn)] px-3 py-1.5 text-sm text-content focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
                          />
                        </div>
                      ) : (
                        <button 
                          onClick={() => setInlineAddProjectId(pId)}
                          className="flex items-center gap-2 text-sm text-content-hint hover:text-content-secondary ml-8 mt-2 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add to-do
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <NewTodoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projects={projects}
          onSave={handleAdd}
        />
      </div>

      {/* Right Panel for Todos */}
      <div className="space-y-6">
        <div className="glass rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] transition-premium p-6">
          <h2 className="text-lg font-semibold text-content mb-6">Stats</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-page rounded-[var(--radius-btn)]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-content">Open</span>
              </div>
              <span className="text-sm font-bold text-content">{openCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-page rounded-[var(--radius-btn)]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-content">Done</span>
              </div>
              <span className="text-sm font-bold text-content">{doneCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-page rounded-[var(--radius-btn)]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-content">Overdue</span>
              </div>
              <span className="text-sm font-bold text-red-500">{overdueCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
