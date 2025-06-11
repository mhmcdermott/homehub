import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { processEmailAttachments } from '@/lib/services/emailProcessor'
import formidable from 'formidable'
import { promises as fs } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface ParsedEmail {
  from: string
  to: string
  subject: string
  text: string
  html: string
  attachments: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      multiples: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB
    })

    const [fields, files] = await form.parse(req)
    
    // Extract email data
    const from = Array.isArray(fields.from) ? fields.from[0] : fields.from
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject
    const text = Array.isArray(fields.text) ? fields.text[0] : fields.text
    
    if (!from) {
      return res.status(400).json({ error: 'No sender email found' })
    }

    // Extract sender email
    const emailMatch = from.match(/<(.+)>/) || [null, from]
    const senderEmail = emailMatch[1]?.toLowerCase()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: senderEmail }
    })

    if (!user) {
      console.log(`Email from unauthorized sender: ${senderEmail}`)
      return res.status(403).json({ error: 'Unauthorized sender' })
    }

    // Process attachments
    const attachments = []
    const fileKeys = Object.keys(files)
    
    for (const key of fileKeys) {
      if (key.startsWith('attachment')) {
        const file = Array.isArray(files[key]) ? files[key][0] : files[key]
        if (file) {
          const content = await fs.readFile(file.filepath)
          attachments.push({
            filename: file.originalFilename || 'unnamed',
            content,
            contentType: file.mimetype || 'application/octet-stream',
            size: file.size
          })
          
          // Clean up temp file
          await fs.unlink(file.filepath)
        }
      }
    }

    // Process documents if there are attachments
    let processedDocuments = []
    if (attachments.length > 0) {
      processedDocuments = await processEmailAttachments(user.id, attachments)
    }

    // Log the email processing
    console.log(`Processed email from ${senderEmail}:`, {
      subject,
      attachments: attachments.length,
      processed: processedDocuments.length
    })

    // Send success response
    res.status(200).json({
      success: true,
      message: `Processed ${processedDocuments.length} documents`,
      documents: processedDocuments.map(doc => ({
        filename: doc.filename,
        category: doc.category,
        confidence: doc.confidence
      }))
    })
  } catch (error) {
    console.error('Email processing error:', error)
    res.status(500).json({ error: 'Failed to process email' })
  }
}