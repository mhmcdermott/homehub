import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'

export default function Reminders() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reminders</h1>
        <p className="text-gray-600">Reminder management coming soon...</p>
      </div>
    </Layout>
  )
}