import React from "react";
import { getAllTodos, getProjects } from "@/app/dashboard/actions";
import TodosClient from "./TodosClient";

export default async function TodosPage() {
  const [todos, projects] = await Promise.all([
    getAllTodos(),
    getProjects(),
  ]);

  return (
    <main className="flex-1 overflow-auto bg-page">
      <div className="max-w-[1200px] mx-auto p-8">
        <TodosClient initialTodos={todos} projects={projects} />
      </div>
    </main>
  );
}
