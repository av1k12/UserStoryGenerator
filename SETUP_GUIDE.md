# Quick Setup Guide for ChatGPT Integration

## 🚀 **Your SAFe User Story Generator is Ready!**

The application is now running at **http://localhost:3000** with full ChatGPT integration!

## 🔑 **To Enable ChatGPT (Optional but Recommended)**

1. **Get an OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key

2. **Add the API Key**:
   ```bash
   # Create environment file
   cp env.example .env.local
   
   # Edit .env.local and add your API key
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart the server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

## 🧪 **Test the Application**

### **Without API Key (Fallback Mode)**
- The app works with enhanced text processing
- Good for testing the interface
- Limited AI capabilities

### **With API Key (Full ChatGPT Mode)**
- Real AI-powered story generation
- Context-aware responses
- Smart suggestions and improvements
- Professional acceptance criteria

## 📝 **Testing Steps**

1. **Setup Page**: http://localhost:3000/setup
   - Fill in team information
   - Save configuration
   - Copy the shareable link

2. **Story Creation**: Use the generated link
   - Write a simple sentence like: "As a customer, I want to reset my password so I can access my account"
   - Click "Generate Story"
   - See the AI-generated user story and acceptance criteria

## 🎯 **Example Test Inputs**

Try these examples:
- `"As a developer, I want to see error logs so I can debug issues faster"`
- `"As an admin, I need to manage user permissions to maintain security"`
- `"As a QA engineer, I want automated test reports so I can track quality metrics"`

## 🔧 **Troubleshooting**

**If you get API errors:**
- Check your API key is correct
- Ensure you have credits in your OpenAI account
- The app will fallback to text processing if API fails

**If the server won't start:**
- Check if port 3000 is available
- Try `npm install` if dependencies are missing

## 🎉 **You're All Set!**

Your SAFe User Story Generator is now ready with:
- ✅ Beautiful, modern UI
- ✅ Team configuration and sharing
- ✅ ChatGPT integration (with API key)
- ✅ Fallback text processing (without API key)
- ✅ Export and copy features
- ✅ Responsive design

Enjoy creating user stories with AI! 🚀 