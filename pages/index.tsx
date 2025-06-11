import Layout from '@/components/Layout'
import DashboardEnhanced from '@/components/DashboardEnhanced'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mb-8">
            Here's what's happening with your household today.
          </p>
        </motion.div>
        <DashboardEnhanced />
      </div>
    </Layout>
  )
}