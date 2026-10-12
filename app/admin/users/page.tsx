import { getAdminUsers } from '../actions';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const initialData = await getAdminUsers({ limit: 50 });

  return <AdminUsersClient initialUsers={initialData.users} totalCount={initialData.totalCount} />;
}

