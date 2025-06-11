import { google } from 'googleapis'
import { processEmailAttachments } from './emailProcessor'
import { prisma } from '@/lib/prisma'
import { JWT } from 'google-auth-library'

interface GmailAttachment {
  filename: string
  content: Buffer
  contentType: string
  size: number
}

interface ProcessedEmail {
  messageId: string
  from: string
  subject: string
  attachments: number
  processed: number
  timestamp: Date
}

class GmailProcessor {
  private gmail: any
  private auth: JWT

  constructor() {
    // Set up Gmail API authentication
    this.auth = new JWT({
      email: process.env.GMAIL_SERVICE_EMAIL,
      key: process.env.GMAIL_SERVICE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    })

    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
  }

  async getUnprocessedEmails(): Promise<any[]> {
    try {
      // Search for unread emails with attachments
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread has:attachment'
      })

      const messages = response.data.messages || []
      console.log(`Found ${messages.length} unprocessed emails`)

      return messages
    } catch (error) {
      console.error('Error fetching emails:', error)
      return []
    }
  }

  async getEmailDetails(messageId: string): Promise<any> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      return response.data
    } catch (error) {
      console.error('Error getting email details:', error)
      return null
    }
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<Buffer | null> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      })

      const data = response.data.data
      return Buffer.from(data, 'base64url')
    } catch (error) {
      console.error('Error getting attachment:', error)
      return null
    }
  }

  extractEmailInfo(emailData: any) {
    const headers = emailData.payload.headers
    const from = headers.find((h: any) => h.name === 'From')?.value || ''
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
    const date = headers.find((h: any) => h.name === 'Date')?.value || ''

    // Extract sender email
    const emailMatch = from.match(/<(.+)>/) || [null, from]
    const senderEmail = emailMatch[1]?.toLowerCase().trim()

    return { from: senderEmail, subject, date }
  }

  async extractAttachments(emailData: any, messageId: string): Promise<GmailAttachment[]> {
    const attachments: GmailAttachment[] = []

    const processParts = async (parts: any[]) => {
      for (const part of parts) {
        if (part.parts) {
          await processParts(part.parts)
        } else if (part.body.attachmentId) {
          const filename = part.filename || 'unnamed'
          const mimeType = part.mimeType || 'application/octet-stream'
          
          // Skip inline images and signatures
          if (filename && !filename.startsWith('image') && part.body.size > 1000) {
            const content = await this.getAttachment(messageId, part.body.attachmentId)
            if (content) {
              attachments.push({
                filename,
                content,
                contentType: mimeType,
                size: part.body.size
              })
            }
          }
        }
      }
    }

    if (emailData.payload.parts) {
      await processParts(emailData.payload.parts)
    }

    return attachments
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
    } catch (error) {
      console.error('Error marking email as read:', error)
    }
  }

  async deleteEmail(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      })
      console.log(`Deleted unauthorized email: ${messageId}`)
    } catch (error) {
      console.error('Error deleting email:', error)
    }
  }

  async addSecurityLabel(messageId: string, labelName: string): Promise<void> {
    try {
      // Labels for security tracking: HomeHub/Unauthorized, HomeHub/Processed, HomeHub/Deleted
      const labelsResponse = await this.gmail.users.labels.list({ userId: 'me' })
      let labelId = labelsResponse.data.labels?.find((l: any) => l.name === labelName)?.id

      if (!labelId) {
        const labelColor = labelName.includes('Unauthorized') 
          ? { backgroundColor: '#e74c3c', textColor: '#ffffff' }
          : labelName.includes('Processed')
          ? { backgroundColor: '#16a085', textColor: '#ffffff' }
          : { backgroundColor: '#f39c12', textColor: '#ffffff' }

        const createResponse = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            color: labelColor
          }
        })
        labelId = createResponse.data.id
      }

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      })
    } catch (error) {
      console.error('Error adding security label:', error)
    }
  }

  isAuthorizedSender(email: string): boolean {
    const authorizedEmails = [
      process.env.USER_EMAIL_1?.toLowerCase(),
      process.env.USER_EMAIL_2?.toLowerCase()
    ].filter(Boolean)

    return authorizedEmails.includes(email.toLowerCase())
  }

  async addLabel(messageId: string, labelName: string): Promise<void> {
    try {
      // First, try to find or create the label
      const labelsResponse = await this.gmail.users.labels.list({ userId: 'me' })
      let labelId = labelsResponse.data.labels?.find((l: any) => l.name === labelName)?.id

      if (!labelId) {
        // Create the label if it doesn't exist
        const createResponse = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            color: {
              backgroundColor: '#16a085',
              textColor: '#ffffff'
            }
          }
        })
        labelId = createResponse.data.id
      }

      // Add the label to the message
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      })
    } catch (error) {
      console.error('Error adding label:', error)
    }
  }

  async processEmails(): Promise<ProcessedEmail[]> {
    const processedEmails: ProcessedEmail[] = []
    const securityLog = {
      processed: 0,
      unauthorized: 0,
      deleted: 0,
      errors: 0
    }

    try {
      const messages = await this.getUnprocessedEmails()
      console.log(`Found ${messages.length} unprocessed emails`)

      for (const message of messages.slice(0, 20)) { // Process max 20 emails at a time
        try {
          const emailData = await this.getEmailDetails(message.id)
          if (!emailData) {
            securityLog.errors++
            continue
          }

          const { from, subject } = this.extractEmailInfo(emailData)
          
          // Security Check: Only process emails from authorized senders
          if (!this.isAuthorizedSender(from)) {
            console.log(`🚨 UNAUTHORIZED EMAIL - Deleting email from: ${from}`)
            
            // Label as unauthorized before deletion (for audit trail)
            await this.addSecurityLabel(message.id, 'HomeHub/Unauthorized')
            
            // Wait a moment for label to be applied
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Delete the unauthorized email
            await this.deleteEmail(message.id)
            
            securityLog.unauthorized++
            securityLog.deleted++
            continue
          }

          // Find authorized user
          const user = await prisma.user.findUnique({
            where: { email: from }
          })

          if (!user) {
            // This shouldn't happen if authorization check passed, but safety first
            console.log(`User not found in database: ${from}`)
            await this.addSecurityLabel(message.id, 'HomeHub/UserNotFound')
            await this.deleteEmail(message.id)
            securityLog.errors++
            continue
          }

          // Extract attachments
          const attachments = await this.extractAttachments(emailData, message.id)
          
          let processedCount = 0
          if (attachments.length > 0) {
            const processed = await processEmailAttachments(user.id, attachments)
            processedCount = processed.length
            console.log(`✅ Processed ${processedCount} documents from authorized sender: ${from}`)
          } else {
            console.log(`📧 Email from ${from} had no valid attachments`)
          }

          // Mark as processed successfully
          await this.markAsRead(message.id)
          await this.addSecurityLabel(message.id, 'HomeHub/Processed')

          processedEmails.push({
            messageId: message.id,
            from,
            subject,
            attachments: attachments.length,
            processed: processedCount,
            timestamp: new Date()
          })

          securityLog.processed++

        } catch (emailError) {
          console.error(`Error processing individual email ${message.id}:`, emailError)
          securityLog.errors++
        }
      }

      // Log security summary
      console.log('🔒 Gmail Processing Security Summary:', securityLog)

    } catch (error) {
      console.error('Error in Gmail processing:', error)
    }

    return processedEmails
  }
}

export const gmailProcessor = new GmailProcessor()
export default gmailProcessor