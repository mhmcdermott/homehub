import Layout from '@/components/Layout'
import ContactsPageSmart from '@/components/ContactsPageSmart'
import { useSession } from 'next-auth/react'

export default function Contacts() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <Layout>
      <ContactsPageSmart />
    </Layout>
  )
}