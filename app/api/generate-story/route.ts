import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface StoryRequest {
  userInput: string
  teamConfig: {
    teamName: string
    mission: string
    projectDescription: string
    userStoryTemplate: string
    teamRoles: string
  }
}

interface StoryResponse {
  formattedStory: string
  suggestions?: string[]
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { userInput, teamConfig } = body

    if (!userInput || !teamConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to enhanced text processing if no API key
      const result = await processUserInputFallback(userInput, teamConfig)
      return NextResponse.json(result)
    }

    // Use ChatGPT for story generation
    const result = await generateStoryWithChatGPT(userInput, teamConfig)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating story:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalStory, tweakInstructions, teamConfig } = body;

    if (!originalStory || !tweakInstructions || !teamConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback: just append tweak instructions to the story
      return NextResponse.json({
        formattedStory: `${originalStory}\n\n(Tweak: ${tweakInstructions})`,
        suggestions: ['No OpenAI API key, tweak applied as note.']
      });
    }

    // Use ChatGPT for tweaking
    const systemPrompt = `You are an expert SAFe agile coach and user story writer. Your task is to help teams refine and improve user stories.\n\nTeam Context:\n- Team Name: ${teamConfig.teamName}\n- Mission: ${teamConfig.mission}\n- Project: ${teamConfig.projectDescription}\n- Team Roles: ${teamConfig.teamRoles}\n\nUser Story Template: ${teamConfig.userStoryTemplate}\n\nInstructions:\n1. Take the provided user story and the user's tweak instructions.\n2. Revise the story according to the instructions, keeping it well-structured and clear.\n3. Provide 1-2 suggestions for further improvement if applicable.\n\nRespond in JSON format:\n{\n  "formattedStory": "the revised user story",\n  "suggestions": ["suggestion 1", "suggestion 2"]\n}`;

    const userPrompt = `Original Story: "${originalStory}"\n\nTweak Instructions: ${tweakInstructions}\n\nPlease revise the user story as requested.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from ChatGPT');
      }
      try {
        const parsed = JSON.parse(response);
        return NextResponse.json({
          formattedStory: parsed.formattedStory || '',
          suggestions: parsed.suggestions || []
        });
      } catch (parseError) {
        // Fallback: just return the text
        return NextResponse.json({
          formattedStory: response,
          suggestions: []
        });
      }
    } catch (error) {
      console.error('ChatGPT API error (tweak):', error);
      return NextResponse.json({
        formattedStory: `${originalStory}\n\n(Tweak failed: ${tweakInstructions})`,
        suggestions: ['AI tweak failed, see error log.']
      });
    }
  } catch (error) {
    console.error('Error tweaking story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateStoryWithChatGPT(input: string, config: any): Promise<StoryResponse> {
  const systemPrompt = `You are an expert SAFe agile coach and user story writer. Your task is to help teams create well-structured user stories.

Team Context:
- Team Name: ${config.teamName}
- Mission: ${config.mission}
- Project: ${config.projectDescription}
- Team Roles: ${config.teamRoles}

User Story Template: ${config.userStoryTemplate}

Instructions:
1. Analyze the user's input and extract the role, feature/functionality, and benefit/value
2. Format the user story using the provided template
3. Provide 1-2 suggestions for improving the story if applicable

Respond in JSON format:
{
  "formattedStory": "the formatted user story",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`

  const userPrompt = `User Input: "${input}"

Please generate a user story based on this input.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from ChatGPT')
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(response)
      return {
        formattedStory: parsed.formattedStory || '',
        suggestions: parsed.suggestions || []
      }
    } catch (parseError) {
      // If JSON parsing fails, extract content manually
      return extractContentFromText(response, config)
    }
  } catch (error) {
    console.error('ChatGPT API error:', error)
    // Fallback to text processing
    return await processUserInputFallback(input, config)
  }
}

function extractContentFromText(text: string, config: any): StoryResponse {
  // Extract user story from ChatGPT response
  const lines = text.split('\n')
  let formattedStory = ''
  let suggestions: string[] = []

  let currentSection = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().includes('user story') || trimmed.toLowerCase().includes('story:')) {
      currentSection = 'story'
    } else if (trimmed.toLowerCase().includes('suggestion')) {
      currentSection = 'suggestions'
    } else if (trimmed && currentSection === 'story') {
      formattedStory = trimmed
    } else if (trimmed && currentSection === 'suggestions') {
      suggestions.push(trimmed)
    }
  }

  return {
    formattedStory: formattedStory || config.userStoryTemplate,
    suggestions
  }
}

async function processUserInputFallback(input: string, config: any): Promise<StoryResponse> {
  // Enhanced text processing as fallback
  const words = input.toLowerCase().split(' ')
  const sentences = input.split(/[.!?]+/)
  
  // Enhanced role extraction
  const rolePatterns = [
    /as\s+an?\s+(\w+)/i,
    /as\s+a\s+(\w+)/i,
    /i\s+am\s+a\s+(\w+)/i,
    /(\w+)\s+here/i
  ]
  
  let role = 'user'
  for (const pattern of rolePatterns) {
    const match = input.match(pattern)
    if (match) {
      role = match[1]
      break
    }
  }
  
  // Enhanced action extraction
  const actionPatterns = [
    /want\s+to\s+([^.]+)/i,
    /need\s+to\s+([^.]+)/i,
    /would\s+like\s+to\s+([^.]+)/i,
    /can\s+([^.]+)/i
  ]
  
  let action = 'access a feature'
  for (const pattern of actionPatterns) {
    const match = input.match(pattern)
    if (match) {
      action = match[1].trim()
      break
    }
  }
  
  // Enhanced benefit extraction
  const benefitPatterns = [
    /so\s+(?:that\s+)?([^.]+)/i,
    /because\s+([^.]+)/i,
    /in\s+order\s+to\s+([^.]+)/i,
    /to\s+([^.]+)/i
  ]
  
  let benefit = 'achieve my goals'
  for (const pattern of benefitPatterns) {
    const match = input.match(pattern)
    if (match) {
      benefit = match[1].trim()
      break
    }
  }
  
  // Generate formatted story
  const formattedStory = config.userStoryTemplate
    .replace('[role]', role)
    .replace('[feature/functionality]', action)
    .replace('[benefit/value]', benefit)
  
  // Generate suggestions for improvement
  const suggestions = generateSuggestions(input, role, action, benefit)
  
  return {
    formattedStory,
    suggestions
  }
}

function generateSuggestions(input: string, role: string, action: string, benefit: string): string[] {
  const suggestions: string[] = []
  
  if (role === 'user') {
    suggestions.push('Consider being more specific about the user role (e.g., "customer", "admin", "developer")')
  }
  
  if (action.length < 10) {
    suggestions.push('Try to be more specific about what functionality you want')
  }
  
  if (benefit.length < 10) {
    suggestions.push('Consider explaining the business value or user benefit more clearly')
  }
  
  if (!input.includes('so') && !input.includes('because') && !input.includes('to')) {
    suggestions.push('Try to include the benefit or reason using words like "so", "because", or "to"')
  }
  
  return suggestions.slice(0, 3) // Limit to 3 suggestions
} 