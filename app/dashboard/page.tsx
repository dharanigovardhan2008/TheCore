import { getProjects, getAllServices, getAllTodos } from './actions';
import { getEnvFiles, getProfile } from './vaultActions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const projects = await getProjects({ showArchived: false, includeArchived: false });
  const services = await getAllServices();
  const todos = await getAllTodos();
  const envFiles = await getEnvFiles();
  const profile = await getProfile();

  return (
    <DashboardClient
      projects={projects}
      services={services}
      todos={todos}
      envFiles={envFiles}
      profile={profile}
    />
  );
}
