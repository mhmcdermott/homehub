import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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
      where: { email: session.user.email }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate a unique email alias for the user
    // In production, this would be a real email address
    const emailHash = crypto
      .createHash('md5')
      .update(user.id)
      .digest('hex')
      .substring(0, 8)
    
    const emailAddress = `${user.name?.toLowerCase().replace(/\s+/g, '.')}.${emailHash}@homehub.uk`

    res.status(200).json({ 
      emailAddress,
      instructions: 'Forward any email with document attachments to this address'
    })
  } catch (error) {
    console.error('Email address error:', error)
    res.status(500).json({ error: 'Failed to generate email address' })
  }
}