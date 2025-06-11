import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queryClaudeWithContext } from '@/lib/services/claude'

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

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        documents: {
          select: {
            filename: true,
            category: true,
            description: true,
            expiryDate: true,
          }
        },
        contacts: {
          select: {
            name: true,
            type: true,
            phone: true,
            email: true,
          }
        },
        reminders: {
          where: { completed: false },
          select: {
            title: true,
            dueDate: true,
            type: true,
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const context = `
    User has ${user.documents.length} documents, ${user.contacts.length} contacts, and ${user.reminders.length} active reminders.
    
    Recent documents: ${user.documents.slice(0, 5).map((d: any) => `${d.filename} (${d.category})`).join(', ')}
    Contacts: ${user.contacts.slice(0, 5).map((c: any) => `${c.name} (${c.type})`).join(', ')}
    Upcoming reminders: ${user.reminders.slice(0, 5).map((r: any) => `${r.title} due ${r.dueDate.toLocaleDateString()}`).join(', ')}
    `

    const response = await queryClaudeWithContext(messages, context)

    res.status(200).json({ response })
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}