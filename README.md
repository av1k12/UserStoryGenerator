# SAFeScript

This application helps teams generate better user stories with AI.

## Per-team Learning (Local Only)

- Generated stories and their tweaks are now saved per team to `.data/team-stories.json` in the project root when running locally.
- When a team generates new stories, the system includes the team's recent stories as background context to improve consistency.
- Tweaks to a story are saved as part of that story's history.

Notes:
- This local JSON store is suitable for development. For production, use a managed database (e.g., Postgres, MongoDB, or Supabase) and replace the storage utility in `lib/teamStorage.ts`.
- Context is used as background only and is not sent across teams.

## Features

### For Agilists (Setup)
- **Team Configuration**: Set up team name, mission, and project description
- **Custom Templates**: Define custom user story templates
- **Role Management**: Specify team roles and responsibilities
- **Link Sharing**: Generate shareable links for team members

### For Team Members (Story Creation)
- **Simple Input**: Write user stories in natural language
- **ChatGPT Integration**: AI-powered story generation with team context
- **Template Consistency**: Ensures all stories follow the team's template
- **Automatic Acceptance Criteria**: AI-generated comprehensive criteria
- **Smart Suggestions**: AI provides improvement recommendations
- **Export Options**: Download stories as text files
- **Copy to Clipboard**: Easy copying of individual stories

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **AI Integration**: OpenAI ChatGPT API
- **Backend**: Next.js API Routes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional, but recommended for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safe-user-story-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up OpenAI API (Optional but Recommended)**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Setting Up Your Team (Agilist)

1. Navigate to `/setup` or click "Get Started" on the homepage
2. Fill in your team information:
   - Team Name
   - Mission Statement
   - Project Description
   - Team Roles
3. Customize your user story template (optional)
4. Save the configuration
5. Copy the generated shareable link

### Creating User Stories (Team Members)

1. Use the link provided by your agilist
2. Write your story in natural language, including:
   - Your role
   - What you want to accomplish
   - Why it's beneficial
3. Click "Generate Story" to get an AI-powered user story
4. Review the generated story, acceptance criteria, and suggestions
5. Copy or download the results

## Example User Story Input

**Input**: "As a customer, I want to reset my password so I can access my account when I forget it"

**Generated Output**:
- **User Story**: "As a customer, I want to reset my password, so that I can access my account when I forget it."
- **Acceptance Criteria**: "Given the user is a customer, When they request a password reset, Then they receive a reset link via email, And they can create a new password, And they can access their account with the new password."
- **AI Suggestions**: 
  - "Consider adding a time limit for password reset links"
  - "Specify the email format for the reset link"

## AI Integration

The application integrates with OpenAI's ChatGPT for intelligent story generation:

### ChatGPT Features
- **Context-Aware**: Uses team mission, project description, and roles
- **Template Compliance**: Ensures stories follow your team's template
- **Smart Extraction**: Identifies roles, actions, and benefits from natural language
- **Comprehensive Criteria**: Generates detailed acceptance criteria
- **Improvement Suggestions**: Provides actionable feedback for better stories

### Fallback Mode
If no OpenAI API key is provided, the application uses enhanced text processing:
- Pattern-based role extraction
- Action and benefit identification
- Basic template formatting
- Simple acceptance criteria generation

## Project Structure

```
safe-user-story-generator/
├── app/
│   ├── api/
│   │   └── generate-story/
│   │       └── route.ts          # ChatGPT story generation API
│   ├── create/
│   │   └── page.tsx              # Story creation page
│   ├── setup/
│   │   └── page.tsx              # Team setup page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── env.example                  # Environment variables template
└── README.md                    # This file
```

## Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the design by modifying:
- `tailwind.config.js` for theme customization
- `app/globals.css` for custom CSS classes

### Templates
User story templates can be customized in the setup page. The default template follows the standard format:
- **User Story**: "As a [role], I want [feature/functionality], so that [benefit/value]."
- **Acceptance Criteria**: Automatically generated by AI

### AI Model
You can customize the ChatGPT model by setting the `OPENAI_MODEL` environment variable:
```bash
OPENAI_MODEL=gpt-4
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `OPENAI_API_KEY` to Vercel environment variables
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

Remember to set the `OPENAI_API_KEY` environment variable in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## Roadmap

- [x] Real AI integration (OpenAI ChatGPT)
- [ ] Story analytics and metrics
- [ ] Team collaboration features
- [ ] Integration with Jira, Azure DevOps
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Story quality scoring
- [ ] Bulk story generation 