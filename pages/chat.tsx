import Layout from '@/components/Layout'
import ChatEnhanced from '@/components/ChatEnhanced'
import { useSession } from 'next-auth/react'

export default function Chat() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <ChatEnhanced />
      </div>
    </Layout>
  )
}