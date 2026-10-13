"use client";

import { useState } from "react";
import { Todo } from "@/lib/types";
import { createTodo, toggleTodo, deleteTodo } from "@/app/dashboard/actions";
import { Trash2, Plus, Check, Calendar } from "lucide-react";

interface TodoListProps {
  projectId: string;
  initialTodos: Todo[];
}

export default function TodoList({ projectId, initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "med" | "high">("med");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (todo: Todo) => {
    const originalTodos = [...todos];
    const updatedTodo = { ...todo, done: !todo.done };
    
    setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
    
    try {
      await toggleTodo(todo.id, updatedTodo.done);
    } catch (e) {
      setTodos(originalTodos);
    }
  };

  const handleDelete = async (id: string) => {
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    
    try {
      await deleteTodo(id);
    } catch (e) {
      setTodos(originalTodos);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || isAdding) return;
    
    setIsAdding(true);
    try {
      const added = await createTodo({
        project_id: projectId,
        text: newText.trim(),
        priority: newPriority,
        done: false,
        due_date: newDueDate || null
      });
      if (added) {
         setTodos([...todos, added]);
         setNewText("");
         setNewDueDate("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };


  return (
    <div className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-6 sm:p-8 h-full flex flex-col hover:shadow-[var(--shadow-card-hover)] transition-premium">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">To-do list</h3>
      
      <div className="space-y-2 mb-6 flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center justify-between group p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-tint)] border border-[var(--border-light)] hover:border-[var(--color-primary)] rounded-[var(--radius-input)] transition-premium shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <button 
                onClick={() => handleToggle(todo)}
                className="w-10 h-10 flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-premium"
                aria-label={todo.done ? "Mark as undone" : "Mark as done"}
              >
                <div className={`w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center transition-all duration-300
                  ${todo.done 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]' 
                    : 'bg-[var(--bg-page)] border-[var(--border-light)] text-transparent group-hover:border-[var(--color-primary)]'}`}>
                  <Check className={`w-3.5 h-3.5 stroke-[3] transition-all duration-300 ${todo.done ? 'scale-100' : 'scale-0'}`} />
                </div>
              </button>
              
              <div className="flex flex-col gap-1 min-w-0">
                <span className={`text-[15px] transition-all duration-300 ${todo.done ? 'text-[var(--text-tertiary)] line-through font-medium' : 'text-[var(--text-primary)] font-bold'}`}>
                  {todo.text}
                </span>
                
                <div className="flex items-center gap-2">
                  {todo.due_date && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-page)] border border-[var(--border-light)] px-2 py-0.5 rounded-md shadow-sm">
                      <Calendar className="w-3 h-3" />
                      <span suppressHydrationWarning>{new Date(todo.due_date).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleDelete(todo.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--color-danger)] sm:opacity-0 group-hover:opacity-100 transition-all duration-200 w-10 h-10 flex items-center justify-center shrink-0 bg-[var(--bg-page)] hover:bg-[var(--color-danger)]/10 rounded-full shadow-sm"
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[var(--border-color)] rounded-[var(--radius-input)] bg-[var(--bg-page)]/50">
            <p className="text-[14px] font-medium text-[var(--text-secondary)]">No to-dos yet. Add one below!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="sticky bottom-0 pt-2 flex flex-col gap-3 z-10 bg-transparent">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add a to-do..."
          className="w-full min-w-0 text-[15px] text-[var(--text-primary)] bg-white border border-[#DCE9E3] rounded-[var(--radius-input)] px-4 h-12 focus:outline-none focus:border-blue-500 shadow-sm transition-premium"
        />
        <div className="flex gap-3 w-full">
          <input 
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="flex-[1.5] min-w-0 text-[14px] font-medium text-[var(--text-secondary)] bg-white border border-[#DCE9E3] rounded-[var(--radius-input)] px-3 h-12 focus:outline-none focus:border-blue-500 shadow-sm transition-premium"
          />
          <div className="flex-1 min-w-0 relative">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="w-full h-12 text-[14px] font-medium text-[var(--text-secondary)] bg-white border border-[#DCE9E3] rounded-[var(--radius-input)] px-3 focus:outline-none focus:border-blue-500 shadow-sm transition-premium appearance-none"
            >
              <option value="low">Low</option>
              <option value="med">Med</option>
              <option value="high">High</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isAdding || !newText.trim()}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-[var(--radius-input)] disabled:opacity-50 flex items-center justify-center w-12 h-12 shrink-0 shadow-sm transition-premium"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
}
