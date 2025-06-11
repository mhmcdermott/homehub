import { useEffect, useState } from 'react'
import { FileText, Users, Bell, AlertCircle, TrendingUp, Calendar, Search } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface DashboardData {
  stats: {
    documents: number
    contacts: number
    reminders: number
  }
  expiringDocuments: any[]
  upcomingReminders: any[]
}

export default function DashboardEnhanced() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border border-blue-400 opacity-20"></div>
        </div>
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
    { 
      name: 'Documents', 
      value: data.stats.documents, 
      icon: FileText, 
      color: 'bg-blue-500',
      trend: '+12%',
      description: 'Total stored'
    },
    { 
      name: 'Contacts', 
      value: data.stats.contacts, 
      icon: Users, 
      color: 'bg-green-500',
      trend: '+5%',
      description: 'Active contacts'
    },
    { 
      name: 'Reminders', 
      value: data.stats.reminders, 
      icon: Bell, 
      color: 'bg-yellow-500',
      trend: '+8%',
      description: 'Upcoming tasks'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Quick Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Quick search documents, contacts, or reminders..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Overview
        </h3>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <dt>
                  <div className={`absolute rounded-md p-3 ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                  <p className="ml-16 text-xs text-gray-400">
                    {item.description}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {item.trend}
                  </p>
                </dd>
                <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-2">
                  <div className="text-xs">
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                      View all<span className="sr-only"> {item.name}</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </dl>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expiring Documents */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            Expiring Documents
            <span className="ml-auto text-sm text-gray-500">Next 30 days</span>
          </h3>
          {data.expiringDocuments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No documents expiring soon</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.expiringDocuments.map((doc, index) => (
                <motion.li 
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-xs text-gray-500">{doc.category}</p>
                    </div>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">
                    {format(new Date(doc.expiryDate), 'dd MMM')}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Upcoming Reminders */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 text-blue-500 mr-2" />
            Upcoming Reminders
            <span className="ml-auto text-sm text-gray-500">Next 7 days</span>
          </h3>
          {data.upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No upcoming reminders</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.upcomingReminders.map((reminder, index) => (
                <motion.li 
                  key={reminder.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                      <p className="text-xs text-gray-500">{reminder.type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {format(new Date(reminder.dueDate), 'dd MMM')}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white"
      >
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
            <FileText className="h-6 w-6 mb-2" />
            <span className="text-sm">Upload Document</span>
          </button>
          <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
            <Users className="h-6 w-6 mb-2" />
            <span className="text-sm">Add Contact</span>
          </button>
          <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
            <Bell className="h-6 w-6 mb-2" />
            <span className="text-sm">Set Reminder</span>
          </button>
          <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
            <Search className="h-6 w-6 mb-2" />
            <span className="text-sm">Search All</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}