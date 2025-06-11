import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function queryClaudeWithContext(
  messages: ChatMessage[],
  context?: string
) {
  try {
    const systemMessage = `You are HomeHub Assistant, a helpful AI that assists with household management queries. 
    You have access to information about the user's documents, contacts, and reminders.
    
    ${context ? `Context: ${context}` : ''}`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemMessage,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('Failed to get response from Claude')
  }
}