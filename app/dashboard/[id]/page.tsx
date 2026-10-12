import { notFound } from "next/navigation";
import { getProject } from "@/app/dashboard/actions";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Basic validation for UUID or our mock projects
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid && !id.includes('mock-project')) {
    notFound();
  }

  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}

