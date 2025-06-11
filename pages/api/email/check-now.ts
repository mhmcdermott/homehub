import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import gmailProcessor from '@/lib/services/gmailProcessor'

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

  try {
    console.log(`Manual Gmail check triggered by ${session.user.email}`)
    const processed = await gmailProcessor.processEmails()
    
    const totalDocs = processed.reduce((sum, p) => sum + p.processed, 0)
    const summary = {
      emailsProcessed: processed.length,
      totalDocuments: totalDocs,
      message: processed.length > 0 
        ? `Processed ${processed.length} authorized emails with ${totalDocs} documents`
        : 'No new authorized emails to process',
      security: 'Only emails from approved senders are processed - others are deleted'
    }

    res.status(200).json({
      success: true,
      summary
    })
  } catch (error) {
    console.error('Manual Gmail check error:', error)
    res.status(500).json({ 
      error: 'Failed to check Gmail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}