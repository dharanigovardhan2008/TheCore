import React from "react";
import { getEnvFiles } from "../vaultActions";
import { getProjects } from "../actions";
import EnvClient from "./EnvClient";

export const metadata = {
  title: ".env Files - The Core",
};

export default async function EnvPage() {
  const [envFiles, projects] = await Promise.all([
    getEnvFiles(),
    getProjects({ includeArchived: true }),
  ]);

  return <EnvClient envFiles={envFiles} projects={projects} />;
}
