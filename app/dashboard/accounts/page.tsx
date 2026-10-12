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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content">Accounts</h1>
        <p className="mt-2 text-content-secondary">
          Manage and view platforms by login email.
        </p>
      </div>

      <AccountsClient projects={projects} services={services} />
    </div>
  )
}
