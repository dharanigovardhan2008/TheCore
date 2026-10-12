import { getAdminPayments } from '../actions';
import AdminPaymentsClient from './AdminPaymentsClient';

export default async function AdminPaymentsPage() {
  const initialData = await getAdminPayments({ limit: 50 });

  return <AdminPaymentsClient initialOrders={initialData.orders} totalCount={initialData.totalCount} />;
}

