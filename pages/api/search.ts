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

  const { q, type } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query required' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const searchTerm = q.toLowerCase()
    const searchType = type as string | undefined

    const results: any = {}

    if (!searchType || searchType === 'documents') {
      results.documents = await prisma.document.findMany({
        where: {
          userId: user.id,
          OR: [
            { filename: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: { tags: true },
        take: 10
      })
    }

    if (!searchType || searchType === 'contacts') {
      results.contacts = await prisma.contact.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { notes: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: { services: true },
        take: 10
      })
    }

    if (!searchType || searchType === 'reminders') {
      results.reminders = await prisma.reminder.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    }

    res.status(200).json(results)
  } catch (error) {
    console.error('Search API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}