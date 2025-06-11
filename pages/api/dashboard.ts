import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        _count: {
          select: {
            documents: true,
            contacts: true,
            reminders: true,
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const expiringDocuments = await prisma.document.findMany({
      where: {
        userId: user.id,
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      },
      orderBy: { expiryDate: 'asc' },
      take: 5
    })

    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        userId: user.id,
        completed: false,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    res.status(200).json({
      stats: {
        documents: user._count.documents,
        contacts: user._count.contacts,
        reminders: user._count.reminders,
      },
      expiringDocuments,
      upcomingReminders
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}