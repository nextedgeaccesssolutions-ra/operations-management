# NEAS Live Operations Center

A comprehensive operations management platform with real-time Gmail integration, Google Sheets monitoring, and professional email management capabilities.

## 🚀 Features

### Live Operations Center
- **Real-time Gmail Monitoring**: Connect to `info.nextedgeaccesssolutions@gmail.com` and `nextedgeaccesssolutions@gmail.com`
- **Professional Email Replies**: Send CEO-style responses with pre-built templates
- **Email Composer**: Create and send marketing emails directly from the app
- **Google Sheets Integration**: Monitor marketing and HR/Finance data in real-time
- **Platform Monitoring**: Track uptime and status of connected platforms
- **Auto-Reply System**: Intelligent email responses based on content analysis

### Virtual Office
- **Interactive Floor Plan**: Visual representation of office layout with agent positions
- **Department Management**: 8 departments with 10+ AI agents
- **Task Management**: Centralized admin controller for all tasks
- **Meeting Rooms**: Book and manage meeting spaces
- **Team Chat**: Real-time communication channels
- **Activity Feed**: Live updates of all office activities

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Gmail accounts to monitor

## 🔧 Setup Instructions

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd neas-virtual-office
npm install
```

### Step 2: Configure Google OAuth

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Navigate to "APIs & Services" → "Library"
   - Enable "Gmail API"
   - Enable "Google Sheets API"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in app details:
     - App name: "NEAS Operations Center"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Add test users (your Gmail accounts)

4. **Create OAuth Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "NEAS Live Ops"
   - Add authorized JavaScript origins:
     ```
     http://localhost:5173
     https://operations-management-neas.netlify.app
     ```
   - Click "Create"
   - **Copy the Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Replace `your-client-id-here.apps.googleusercontent.com` with your actual OAuth Client ID.

### Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

### Step 5: Connect Gmail

1. Login with demo credentials: `demo@neas.co` / `demo123`
2. Click "🚀 Live Ops Center" in the sidebar
3. Follow the Setup Wizard (4 steps)
4. Click "Connect Google" button
5. Authenticate with your Gmail account
6. Grant necessary permissions

## 🌐 Deployment

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod
```

Or use the Netlify dashboard:
1. Go to https://app.netlify.com/
2. Drag and drop the `dist` folder
3. Your site will be live at: https://operations-management-neas.netlify.app/

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## 🔐 Security Notes

- **Never commit `.env` file** to version control
- OAuth Client ID is safe to expose in frontend code
- Access tokens are stored in browser memory only
- Refresh tokens are not used (user must re-authenticate each session)
- All API calls are made directly from the browser to Google APIs

## 📧 Email Templates

The app includes professional CEO-style email templates:

### Customer Inquiry Response
```
Thank you for reaching out to Next Edge Access Solutions. I've received your message and will review it personally. Our team will respond within 24 hours with a comprehensive solution.

Best regards,
[Your Name]
CEO, Next Edge Access Solutions
```

### Urgent Issue Response
```
I understand the urgency of this matter. I'm personally overseeing this situation and have escalated it to our senior team. You'll hear from us within 2 hours with a resolution plan.

Best regards,
[Your Name]
CEO, Next Edge Access Solutions
```

### Partnership Inquiry Response
```
Thank you for your interest in partnering with NEAS. I'd welcome the opportunity to discuss how we can create value together. Let's schedule a call this week to explore possibilities.

Best regards,
[Your Name]
CEO, Next Edge Access Solutions
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API Integration**: Google APIs (Gmail, Sheets)
- **Authentication**: Google OAuth 2.0
- **Deployment**: Netlify

## 📊 Monitored Resources

### Email Accounts
- `info.nextedgeaccesssolutions@gmail.com`
- `nextedgeaccesssolutions@gmail.com`

### Google Sheets
- Marketing Data: https://docs.google.com/spreadsheets/d/1zFWIjmKYJe9T0_h32IU23CiBOYuo-TVZY3MNHfTNf8A/edit
- HR & Finance: https://docs.google.com/spreadsheets/d/1hOf_eByDKcv6GEQiz44s37xqzf-cbbHY0kTVBZikEDE/edit

### Platform Monitoring
- NEAS Platform: https://neas-platform-preview.vercel.app/login

## 🎯 Usage Guide

### Email Monitoring
1. Navigate to "Live Ops Center" → "Email Monitor"
2. View all emails from connected accounts
3. Click on any email to read full content
4. Use "Reply as CEO" to send professional responses
5. Use "Compose" to create new emails

### Task Management
1. Navigate to "Admin Panel"
2. View all tasks across departments
3. Start, pause, complete, or cancel tasks
4. Filter by status, priority, or department
5. Track task progress in real-time

### Meeting Rooms
1. Navigate to "Meeting Rooms"
2. View room availability
3. Book rooms for meetings
4. See current meetings and participants

### Team Chat
1. Navigate to "Team Chat"
2. Join different channels (General, Operations, Alerts, Social)
3. Send messages to team members
4. View message history

## 🐛 Troubleshooting

### "Token client not initialized" Error
- **Cause**: Google API scripts not loaded or OAuth Client ID not configured
- **Solution**: 
  1. Check browser console for errors
  2. Verify `.env` file has correct `VITE_GOOGLE_CLIENT_ID`
  3. Restart development server
  4. Clear browser cache and reload

### "Pop-up was blocked" Error
- **Cause**: Browser blocked OAuth authentication pop-up
- **Solution**: Allow pop-ups for your site in browser settings

### "Access was denied" Error
- **Cause**: User denied OAuth permissions
- **Solution**: Try again and grant all required permissions

### "Invalid OAuth Client ID" Error
- **Cause**: Client ID is incorrect or not properly configured
- **Solution**: 
  1. Verify Client ID in Google Cloud Console
  2. Check authorized JavaScript origins match your domain
  3. Ensure OAuth consent screen is configured

### Emails Not Loading
- **Cause**: Gmail API permissions not granted
- **Solution**: Re-authenticate and grant Gmail API access

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | Yes |

## 🔄 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck
```

## 📄 License

Proprietary - Next Edge Access Solutions

## 🤝 Support

For issues or questions:
- Check the Setup Wizard in the app
- Review this README
- Check browser console for errors
- Verify Google Cloud Console configuration

## 🎉 Live Demo

Visit: https://operations-management-neas.netlify.app/

Login: `demo@neas.co` / `demo123`

---

Built with ❤️ by Next Edge Access Solutions
