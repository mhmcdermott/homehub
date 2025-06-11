import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'

export default function Contacts() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contacts</h1>
        <p className="text-gray-600">Contact management coming soon...</p>
      </div>
    </Layout>
  )
}