import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
  size: number
}

interface ProcessedDocument {
  filename: string
  category: Category
  description: string
  expiryDate: Date | null
  tags: string[]
  confidence: number
}

// AI-powered document categorization
export async function categorizeDocument(
  filename: string,
  contentType: string,
  textContent?: string
): Promise<ProcessedDocument> {
  const lowerFilename = filename.toLowerCase()
  const currentYear = new Date().getFullYear()
  
  // Smart categorization rules
  const rules = [
    {
      patterns: ['insurance', 'policy', 'coverage', 'premium'],
      category: Category.INSURANCE,
      expiryMonths: 12,
      tags: ['insurance', 'renewal']
    },
    {
      patterns: ['warranty', 'guarantee', 'protection'],
      category: Category.WARRANTY,
      expiryMonths: 24,
      tags: ['warranty', 'protection']
    },
    {
      patterns: ['manual', 'guide', 'instructions', 'user guide'],
      category: Category.MANUAL,
      expiryMonths: null,
      tags: ['manual', 'reference']
    },
    {
      patterns: ['contract', 'agreement', 'lease', 'tenancy'],
      category: Category.CONTRACT,
      expiryMonths: 12,
      tags: ['contract', 'legal']
    },
    {
      patterns: ['mot', 'vehicle', 'car', 'automotive', 'driving'],
      category: Category.AUTOMOTIVE,
      expiryMonths: 12,
      tags: ['vehicle', 'transport']
    },
    {
      patterns: ['medical', 'health', 'doctor', 'prescription', 'nhs'],
      category: Category.MEDICAL,
      expiryMonths: 6,
      tags: ['health', 'medical']
    },
    {
      patterns: ['invoice', 'receipt', 'bill', 'payment', 'statement'],
      category: Category.FINANCIAL,
      expiryMonths: null,
      tags: ['finance', 'payment']
    },
    {
      patterns: ['passport', 'visa', 'boarding', 'travel', 'flight'],
      category: Category.TRAVEL,
      expiryMonths: null,
      tags: ['travel', 'documents']
    },
    {
      patterns: ['mortgage', 'property', 'deed', 'title', 'survey'],
      category: Category.PROPERTY,
      expiryMonths: null,
      tags: ['property', 'home']
    },
    {
      patterns: ['utility', 'electric', 'gas', 'water', 'broadband', 'council'],
      category: Category.HOUSEHOLD,
      expiryMonths: 12,
      tags: ['utilities', 'household']
    }
  ]
  
  let bestMatch = {
    category: Category.OTHER,
    confidence: 0,
    expiryMonths: null as number | null,
    tags: ['uncategorized'] as string[]
  }
  
  // Check filename and content against rules
  for (const rule of rules) {
    let matches = 0
    const searchText = `${lowerFilename} ${(textContent || '').toLowerCase()}`
    
    for (const pattern of rule.patterns) {
      if (searchText.includes(pattern)) {
        matches++
      }
    }
    
    const confidence = matches / rule.patterns.length
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category: rule.category,
        confidence,
        expiryMonths: rule.expiryMonths,
        tags: rule.tags
      }
    }
  }
  
  // Extract dates from filename
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g, // DD/MM/YYYY or similar
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2}),? (\d{4})/gi,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g, // YYYY-MM-DD
  ]
  
  let extractedDate: Date | null = null
  for (const pattern of datePatterns) {
    const match = lowerFilename.match(pattern)
    if (match) {
      // Try to parse the date
      try {
        extractedDate = new Date(match[0])
        if (!isNaN(extractedDate.getTime())) {
          break
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  // Calculate expiry date
  let expiryDate: Date | null = null
  if (bestMatch.expiryMonths) {
    const baseDate = extractedDate || new Date()
    expiryDate = new Date(baseDate)
    expiryDate.setMonth(expiryDate.getMonth() + bestMatch.expiryMonths)
  }
  
  // Generate description
  const description = `${bestMatch.category.charAt(0) + bestMatch.category.slice(1).toLowerCase()} document${
    extractedDate ? ` from ${extractedDate.toLocaleDateString('en-GB')}` : ''
  }${bestMatch.confidence < 0.5 ? ' (auto-categorized with low confidence)' : ''}`
  
  // Add year tag if found
  const yearMatch = filename.match(/20\d{2}/)
  if (yearMatch) {
    bestMatch.tags.push(yearMatch[0])
  }
  
  return {
    filename,
    category: bestMatch.category,
    description,
    expiryDate,
    tags: bestMatch.tags,
    confidence: bestMatch.confidence
  }
}

// Process email attachments
export async function processEmailAttachments(
  userId: string,
  attachments: EmailAttachment[]
): Promise<any[]> {
  const uploadDir = path.join(process.cwd(), 'uploads', userId)
  await fs.mkdir(uploadDir, { recursive: true })
  
  const processedDocuments = []
  
  for (const attachment of attachments) {
    try {
      // Generate unique filename
      const uniqueId = crypto.randomBytes(8).toString('hex')
      const ext = path.extname(attachment.filename)
      const baseFilename = path.basename(attachment.filename, ext)
      const uniqueFilename = `${baseFilename}_${uniqueId}${ext}`
      const filepath = path.join(userId, uniqueFilename)
      const fullPath = path.join(uploadDir, uniqueFilename)
      
      // Save file
      await fs.writeFile(fullPath, attachment.content)
      
      // Categorize document
      const categorized = await categorizeDocument(
        attachment.filename,
        attachment.contentType
      )
      
      // Create database entry
      const document = await prisma.document.create({
        data: {
          filename: attachment.filename,
          filepath,
          size: attachment.size,
          mimeType: attachment.contentType,
          category: categorized.category,
          description: categorized.description,
          expiryDate: categorized.expiryDate,
          userId,
          tags: {
            connectOrCreate: categorized.tags.map(tag => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        },
        include: { tags: true }
      })
      
      processedDocuments.push({
        ...document,
        confidence: categorized.confidence,
        autoProcessed: true
      })
    } catch (error) {
      console.error(`Failed to process attachment ${attachment.filename}:`, error)
    }
  }
  
  return processedDocuments
}