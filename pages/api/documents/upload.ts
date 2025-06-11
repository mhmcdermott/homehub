import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import formidable from 'formidable'
import fs from 'fs/promises'
import path from 'path'
import { Category } from '@prisma/client'
import { categorizeDocument } from '@/lib/services/emailProcessor'

export const config = {
  api: {
    bodyParser: false,
  },
}

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const uploadDir = path.join(process.cwd(), 'uploads', user.id)
    await fs.mkdir(uploadDir, { recursive: true })

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })

    const [fields, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const autoCategize = fields.autoCategize?.[0] === 'true'
    let category = fields.category?.[0] as Category
    let description = fields.description?.[0] as string
    let expiryDate = fields.expiryDate?.[0] as string
    let tags = fields.tags?.[0] as string

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const filename = file.originalFilename || 'unnamed'
    const filepath = path.join(user.id, path.basename(file.filepath))

    // If auto-categorization is enabled or no category provided
    if (autoCategize || !category) {
      const categorized = await categorizeDocument(
        filename,
        file.mimetype || 'application/octet-stream'
      )
      
      // Use AI suggestions if fields are empty
      if (!category) category = categorized.category
      if (!description) description = categorized.description
      if (!expiryDate && categorized.expiryDate) {
        expiryDate = categorized.expiryDate.toISOString()
      }
      if (!tags) tags = categorized.tags.join(', ')
    }

    if (!category || !Object.values(Category).includes(category)) {
      return res.status(400).json({ error: 'Invalid category' })
    }

    const document = await prisma.document.create({
      data: {
        filename,
        filepath,
        size: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        category,
        description,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        userId: user.id,
        tags: tags ? {
          connectOrCreate: tags.split(',').map(tag => ({
            where: { name: tag.trim() },
            create: { name: tag.trim() }
          }))
        } : undefined
      },
      include: { tags: true }
    })

    res.status(200).json({
      ...document,
      autoProcessed: autoCategize || !fields.category
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload document' })
  }
}