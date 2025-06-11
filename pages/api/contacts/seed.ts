import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContactType } from '@prisma/client'

const sampleContacts = [
  // Emergency Contacts
  { name: 'Emergency Services', type: 'EMERGENCY', phone: '999', notes: 'Police, Fire, Ambulance' },
  { name: 'NHS 111', type: 'HEALTHCARE', phone: '111', notes: 'Non-emergency medical advice' },
  { name: 'Gas Emergency', type: 'EMERGENCY', phone: '0800 111 999', notes: 'National Gas Emergency Service' },
  
  // Utilities
  { name: 'British Gas', type: 'UTILITY', phone: '0333 202 9802', notes: 'Gas and electricity supplier' },
  { name: 'Thames Water', type: 'UTILITY', phone: '0800 316 9800', notes: 'Water supply' },
  { name: 'BT', type: 'UTILITY', phone: '0800 800 150', notes: 'Internet and phone' },
  { name: 'Council Tax', type: 'UTILITY', phone: '020 7527 2633', notes: 'Local council services' },
  
  // Healthcare
  { name: 'Local GP Practice', type: 'HEALTHCARE', phone: '020 7123 4567', address: 'High Street Medical Centre' },
  { name: 'NHS Dentist', type: 'HEALTHCARE', phone: '020 7123 4568', address: 'Dental Practice' },
  { name: 'Local Pharmacy', type: 'HEALTHCARE', phone: '020 7123 4569', address: 'High Street Pharmacy' },
  
  // Contractors
  { name: 'Local Plumber', type: 'CONTRACTOR', phone: '07123 456789', notes: 'Emergency plumbing services' },
  { name: 'Electrician', type: 'CONTRACTOR', phone: '07123 456790', notes: 'Electrical repairs and installations' },
  { name: 'Handyman', type: 'CONTRACTOR', phone: '07123 456791', notes: 'General household repairs' },
  
  // Suppliers
  { name: 'Tesco Delivery', type: 'SUPPLIER', phone: '0345 677 9000', notes: 'Online grocery delivery' },
  { name: 'Local Hardware Store', type: 'SUPPLIER', phone: '020 7123 4570', address: 'Main Road Hardware' },
  { name: 'Pharmacy Delivery', type: 'SUPPLIER', phone: '020 7123 4571', notes: 'Prescription delivery service' }
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  try {
    // Check if user already has contacts
    const existingCount = await prisma.contact.count({
      where: { userId: user.id }
    })

    if (existingCount > 0) {
      return res.status(400).json({ 
        error: 'User already has contacts. Delete existing contacts first to reseed.' 
      })
    }

    // Create sample contacts
    const createdContacts = await Promise.all(
      sampleContacts.map(contact =>
        prisma.contact.create({
          data: {
            ...contact,
            type: contact.type as ContactType,
            userId: user.id
          }
        })
      )
    )

    res.status(200).json({
      message: `Successfully created ${createdContacts.length} sample contacts`,
      contacts: createdContacts
    })
  } catch (error) {
    console.error('Seed contacts error:', error)
    res.status(500).json({ error: 'Failed to create sample contacts' })
  }
}