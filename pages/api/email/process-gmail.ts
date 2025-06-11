import { NextApiRequest, NextApiResponse } from 'next'
import gmailProcessor from '@/lib/services/gmailProcessor'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple API key authentication for cron jobs
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.GMAIL_PROCESSOR_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('Starting Gmail processing...')
    const processed = await gmailProcessor.processEmails()
    
    const summary = {
      emailsProcessed: processed.length,
      totalDocuments: processed.reduce((sum, p) => sum + p.processed, 0),
      totalAttachments: processed.reduce((sum, p) => sum + p.attachments, 0),
      processedAt: new Date().toISOString(),
      security: {
        authorizedSenders: [process.env.USER_EMAIL_1, process.env.USER_EMAIL_2].filter(Boolean),
        unauthorizedEmailsDeleted: true
      },
      details: processed
    }

    console.log('Gmail processing complete:', summary)
    
    res.status(200).json({
      success: true,
      summary
    })
  } catch (error) {
    console.error('Gmail processing error:', error)
    res.status(500).json({ 
      error: 'Failed to process Gmail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}