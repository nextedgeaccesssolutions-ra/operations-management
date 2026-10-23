# NEAS Live Operations Center — Google API Setup Guide

## 🚀 What This System Does

Your NEAS Virtual Office now includes a **Live Operations Center** with:

- ✅ **24/7 Email Monitoring** for both accounts:
  - `info.nextedgeaccesssolutions@gmail.com`
  - `nextedgeaccesssolutions@gmail.com`
- ✅ **Google Sheets Integration** for Marketing & HR/Finance data
- ✅ **Platform Monitoring** for neas-platform-preview.vercel.app
- ✅ **CEO Auto-Reply Templates** for professional responses
- ✅ **Admin Controller** for centralized task management

---

## 🔧 To Enable Live Google API Integration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it: `NEAS Operations Center`
4. Click **"Create"**

### Step 2: Enable Required APIs

In your new project, go to **"APIs & Services"** → **"Library"** and enable:

1. **Gmail API** — for email monitoring & sending
2. **Google Sheets API** — for reading spreadsheet data
3. **Google Drive API** — for file access (optional)

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the **OAuth consent screen**:
   - User type: **External**
   - App name: `NEAS Operations Center`
   - User support email: `info.nextedgeaccesssolutions@gmail.com`
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
5. Add test users:
   - `info.nextedgeaccesssolutions@gmail.com`
   - `nextedgeaccesssolutions@gmail.com`
6. Create **OAuth client ID**:
   - Application type: **Web application**
   - Name: `NEAS Live Ops`
   - Authorized JavaScript origins: `https://operations-management-neas.netlify.app`
   - Authorized redirect URIs: `https://operations-management-neas.netlify.app/**`
7. Download the credentials JSON

### Step 4: Add Credentials to Your App

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here
```

### Step 5: Deploy Updated Code

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## 📊 Monitored Resources

### Email Accounts
- ✅ `info.nextedgeaccesssolutions@gmail.com`
- ✅ `nextedgeaccesssolutions@gmail.com`

### Google Sheets
- **Marketing Data**: https://docs.google.com/spreadsheets/d/1zFWIjmKYJe9T0_h32IU23CiBOYuo-TVZY3MNHfTNf8A/edit
- **HR & Finance**: https://docs.google.com/spreadsheets/d/1hOf_eByDKcv6GEQiz44s37xqzf-cbbHY0kTVBZikEDE/edit

### Platform Monitoring
- **NEAS Platform**: https://neas-platform-preview.vercel.app/login

---

## 🤖 CEO Auto-Reply Templates

The system includes 3 professional auto-reply templates:

1. **Customer Inquiry** — Professional & Reassuring tone
2. **Urgent Issue** — Urgent & Action-Oriented tone
3. **Partnership Inquiry** — Strategic & Open tone

These can be customized in the **Live Ops Center → Auto-Reply** tab.

---

## 🎯 Current Status

**Without Google API credentials:**
- ✅ UI is fully functional
- ✅ Demo data is displayed
- ✅ All features are accessible
- ❌ Real email monitoring is disabled
- ❌ Real Google Sheets data is not loaded
- ❌ Auto-reply cannot send emails

**With Google API credentials:**
- ✅ Real-time email monitoring (30-second polling)
- ✅ Live Google Sheets data sync
- ✅ Automated CEO-style email replies
- ✅ Full 24/7 operations capability

---

## 🚀 Quick Start

1. **View the app**: https://operations-management-neas.netlify.app/
2. **Login**: `demo@neas.co` / `demo123`
3. **Navigate**: Click **🚀 Live Ops Center** in the sidebar
4. **Explore**: Email Monitor, Google Sheets, Platform Monitor, Auto-Reply tabs

---

## 📞 Support

For Google API setup assistance:
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Built with React + Vite + Tailwind CSS**  
**Deployed on Netlify**: https://operations-management-neas.netlify.app/
