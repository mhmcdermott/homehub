import Layout from '@/components/Layout'
import DocumentsPageSmart from '@/components/DocumentsPageSmart'
import { useSession } from 'next-auth/react'

export default function Documents() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <Layout>
      <DocumentsPageSmart />
    </Layout>
  )
}