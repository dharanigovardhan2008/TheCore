import { getProjects, getAllServices } from '../actions'
import AccountsClient from './AccountsClient'

export const metadata = {
  title: 'Accounts',
}

export default async function AccountsPage() {
  const [projects, services] = await Promise.all([
    getProjects({ includeArchived: true }),
    getAllServices()
  ])

  return <AccountsClient projects={projects} services={services} />
}
