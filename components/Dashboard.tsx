import { useEffect, useState } from 'react'
import { FileText, Users, Bell, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface DashboardData {
  stats: {
    documents: number
    contacts: number
    reminders: number
  }
  expiringDocuments: any[]
  upcomingReminders: any[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-600 p-4">
        {error || 'Failed to load dashboard data'}
      </div>
    )
  }

  const stats = [
    { name: 'Documents', value: data.stats.documents, icon: FileText, color: 'bg-blue-500' },
    { name: 'Contacts', value: data.stats.contacts, icon: Users, color: 'bg-green-500' },
    { name: 'Reminders', value: data.stats.reminders, icon: Bell, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Overview
        </h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
              >
                <dt>
                  <div className={`absolute rounded-md p-3 ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            Expiring Documents
          </h3>
          {data.expiringDocuments.length === 0 ? (
            <p className="text-gray-500">No documents expiring soon</p>
          ) : (
            <ul className="space-y-3">
              {data.expiringDocuments.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">{doc.category}</p>
                  </div>
                  <span className="text-sm text-orange-600">
                    {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 text-blue-500 mr-2" />
            Upcoming Reminders
          </h3>
          {data.upcomingReminders.length === 0 ? (
            <p className="text-gray-500">No upcoming reminders</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingReminders.map((reminder) => (
                <li key={reminder.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                    <p className="text-sm text-gray-500">{reminder.type}</p>
                  </div>
                  <span className="text-sm text-blue-600">
                    {format(new Date(reminder.dueDate), 'dd MMM yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}