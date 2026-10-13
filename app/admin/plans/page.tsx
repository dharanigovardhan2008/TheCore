import { getAdminPlanConfigs } from '../actions';
import AdminPlansClient from './AdminPlansClient';

export default async function AdminPlansPage() {
  const plans = await getAdminPlanConfigs();

  return <AdminPlansClient initialPlans={plans} />;
}
