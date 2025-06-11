import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContactType } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  try {
    if (req.method === 'GET') {
      const contacts = await prisma.contact.findMany({
        where: { userId: user.id },
        include: {
          services: {
            orderBy: { nextServiceDate: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      })

      res.status(200).json(contacts)
    } 
    else if (req.method === 'POST') {
      const { name, type, phone, email, address, notes } = req.body

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' })
      }

      if (!Object.values(ContactType).includes(type)) {
        return res.status(400).json({ error: 'Invalid contact type' })
      }

      const contact = await prisma.contact.create({
        data: {
          name,
          type,
          phone: phone || null,
          email: email || null,
          address: address || null,
          notes: notes || null,
          userId: user.id
        },
        include: {
          services: true
        }
      })

      res.status(201).json(contact)
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Contacts API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}