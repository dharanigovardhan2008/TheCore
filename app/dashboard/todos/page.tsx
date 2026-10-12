import React from "react";
import { getAllTodos, getProjects } from "@/app/dashboard/actions";
import TodosClient from "./TodosClient";

export default async function TodosPage() {
  const [todos, projects] = await Promise.all([
    getAllTodos(),
    getProjects(),
  ]);

  return <TodosClient initialTodos={todos} projects={projects} />;
}
