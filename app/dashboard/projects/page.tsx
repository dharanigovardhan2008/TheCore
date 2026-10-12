import { getProjects, getAllServices, getAllTodos } from '../actions';
import { getEnvFiles } from '../vaultActions';
import ProjectsClient from './ProjectsClient';

export default async function ProjectsPage() {
  const projects = await getProjects({ showArchived: false, includeArchived: false });
  const services = await getAllServices();
  const todos = await getAllTodos();
  const envFiles = await getEnvFiles();

  return (
    <ProjectsClient
      projects={projects}
      services={services}
      todos={todos}
      envFiles={envFiles}
    />
  );
}
