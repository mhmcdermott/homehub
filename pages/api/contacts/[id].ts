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

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  try {
    if (req.method === 'PUT') {
      const { name, type, phone, email, address, notes } = req.body

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' })
      }

      if (!Object.values(ContactType).includes(type)) {
        return res.status(400).json({ error: 'Invalid contact type' })
      }

      // Verify the contact belongs to the user
      const existingContact = await prisma.contact.findFirst({
        where: { id, userId: user.id }
      })

      if (!existingContact) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: {
          name,
          type,
          phone: phone || null,
          email: email || null,
          address: address || null,
          notes: notes || null
        },
        include: {
          services: true
        }
      })

      res.status(200).json(contact)
    } 
    else if (req.method === 'DELETE') {
      // Verify the contact belongs to the user
      const existingContact = await prisma.contact.findFirst({
        where: { id, userId: user.id }
      })

      if (!existingContact) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      await prisma.contact.delete({
        where: { id }
      })

      res.status(200).json({ message: 'Contact deleted successfully' })
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Contact API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}