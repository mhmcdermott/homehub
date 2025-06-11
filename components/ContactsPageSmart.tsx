import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, User, Building, AlertCircle, Heart, Wrench, Zap, Car, Home } from 'lucide-react'
import { ContactType } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Contact {
  id: string
  name: string
  type: ContactType
  phone?: string
  email?: string
  address?: string
  notes?: string
  services: Service[]
  createdAt: string
}

interface Service {
  id: string
  name: string
  description?: string
  lastServiceDate?: string
  nextServiceDate?: string
}

const contactTypeIcons = {
  SUPPLIER: Building,
  CONTRACTOR: Wrench,
  EMERGENCY: AlertCircle,
  UTILITY: Zap,
  HEALTHCARE: Heart,
  OTHER: User
}

const contactTypeColors = {
  SUPPLIER: 'bg-blue-500',
  CONTRACTOR: 'bg-orange-500',
  EMERGENCY: 'bg-red-500',
  UTILITY: 'bg-green-500',
  HEALTHCARE: 'bg-purple-500',
  OTHER: 'bg-gray-500'
}

export default function ContactsPageSmart() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<ContactType | 'ALL'>('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'OTHER' as ContactType,
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingContact ? 'PUT' : 'POST'
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchContacts()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save contact:', error)
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchContacts()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'OTHER',
      phone: '',
      email: '',
      address: '',
      notes: ''
    })
    setShowAddForm(false)
    setEditingContact(null)
  }

  const startEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      type: contact.type,
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      notes: contact.notes || ''
    })
    setEditingContact(contact)
    setShowAddForm(true)
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone?.includes(searchQuery) ||
                         contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'ALL' || contact.type === selectedType
    return matchesSearch && matchesType
  })

  const contactCounts = contacts.reduce((acc, contact) => {
    acc[contact.type] = (acc[contact.type] || 0) + 1
    return acc
  }, {} as Record<ContactType, number>)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contacts</h2>
        <p className="text-gray-600">
          Manage your household contacts, suppliers, and service providers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {Object.values(ContactType).map((type) => {
          const Icon = contactTypeIcons[type]
          const count = contactCounts[type] || 0
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-lg shadow p-4 text-center cursor-pointer transition-all hover:shadow-md ${
                selectedType === type ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType(selectedType === type ? 'ALL' : type)}
            >
              <Icon className={`h-6 w-6 mx-auto mb-2 text-white p-1 rounded ${contactTypeColors[type]}`} />
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize">{type.toLowerCase()}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.values(ContactType).map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredContacts.map((contact, index) => {
            const Icon = contactTypeIcons[contact.type]
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${contactTypeColors[contact.type]}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{contact.type.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEdit(contact)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {contact.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{contact.address}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      {contact.notes}
                    </div>
                  )}
                </div>

                {contact.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                    <div className="space-y-1">
                      {contact.services.map(service => (
                        <div key={service.id} className="text-xs text-gray-500">
                          {service.name}
                          {service.nextServiceDate && (
                            <span className="ml-2 text-blue-600">
                              Next: {new Date(service.nextServiceDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchQuery || selectedType !== 'ALL' 
              ? 'No contacts match your search criteria' 
              : 'No contacts yet. Add your first contact to get started!'}
          </p>
        </div>
      )}
    </div>
  )
}