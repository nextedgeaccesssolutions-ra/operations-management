# 🔧 Complete Setup Guide: Gmail Integration

This guide will help you connect your Gmail accounts to the NEAS Live Operations Center.

## ⚡ Quick Start (5 Minutes)

### What You Need:
1. Access to Google Cloud Console
2. Your Gmail accounts:
   - `info.nextedgeaccesssolutions@gmail.com`
   - `nextedgeaccesssolutions@gmail.com`
3. 5 minutes of time

---

## 📋 Step-by-Step Instructions

### Step 1: Create Google Cloud Project (1 minute)

1. Go to **https://console.cloud.google.com/**
2. Click the project dropdown at the top
3. Click **"NEW PROJECT"**
4. Enter project name: `NEAS Operations`
5. Click **"CREATE"**
6. Wait for project to be created (10 seconds)

---

### Step 2: Enable APIs (1 minute)

1. In the navigation menu (☰), go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on it, then click **"ENABLE"**
4. Go back to Library
5. Search for **"Google Sheets API"**
6. Click on it, then click **"ENABLE"**

---

### Step 3: Configure OAuth Consent Screen (1 minute)

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for testing with your own accounts)
3. Click **"CREATE"**
4. Fill in the form:
   - **App name**: `NEAS Operations Center`
   - **User support email**: Select your email
   - **Developer contact information**: Your email address
5. Click **"SAVE AND CONTINUE"**
6. On "Scopes" page, click **"ADD OR REMOVE SCOPES"**
7. Search and select these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
8. Click **"UPDATE"**
9. Click **"SAVE AND CONTINUE"**
10. On "Test users" page, click **"ADD USERS"**
11. Add your Gmail accounts:
    - `info.nextedgeaccesssolutions@gmail.com`
    - `nextedgeaccesssolutions@gmail.com`
12. Click **"ADD"**
13. Click **"SAVE AND CONTINUE"**
14. Review and click **"BACK TO DASHBOARD"**

---

### Step 4: Create OAuth Client ID (1 minute)

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Fill in the form:
   - **Application type**: `Web application`
   - **Name**: `NEAS Live Ops`
5. Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**
6. Add these URLs:
   ```
   http://localhost:5173
   https://operations-management-neas.netlify.app
   ```
7. Click **"CREATE"**
8. **IMPORTANT**: Copy the **Client ID** that appears
   - It looks like: `123456789-abc123def456.apps.googleusercontent.com`
   - Save it somewhere safe (you'll need it next)

---

### Step 5: Add Client ID to Your App (30 seconds)

**Option A: Using the App's Setup Wizard**
1. Open your app at https://operations-management-neas.netlify.app/
2. Login with `demo@neas.co` / `demo123`
3. Click **"🚀 Live Ops Center"**
4. Click **"🔧 Setup Wizard"**
5. Follow the 4-step guide
6. When you reach Step 4, paste your Client ID

**Option B: Manual Configuration**
1. Open your project folder
2. Create a file named `.env` in the root directory
3. Add this line:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
4. Replace `your-client-id-here.apps.googleusercontent.com` with your actual Client ID
5. Save the file

---

### Step 6: Redeploy the App (30 seconds)

**If using Netlify:**
```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

**If using Netlify Dashboard:**
1. Go to https://app.netlify.com/
2. Select your site
3. Go to **"Deploys"** tab
4. Drag and drop the `dist` folder
5. Wait for deployment (30 seconds)

---

### Step 7: Connect Your Gmail (30 seconds)

1. Open your app at https://operations-management-neas.netlify.app/
2. Login with `demo@neas.co` / `demo123`
3. Click **"🚀 Live Ops Center"**
4. You should see **"✓ OAuth Client ID is configured"**
5. Click **"🔗 Connect Google"** button
6. A Google sign-in window will pop up
7. **Choose one of your Gmail accounts**:
   - `info.nextedgeaccesssolutions@gmail.com` OR
   - `nextedgeaccesssolutions@gmail.com`
8. You'll see a warning: **"Google hasn't verified this app"**
   - This is normal for testing
   - Click **"Advanced"**
   - Click **"Go to NEAS Operations Center (unsafe)"**
9. Review permissions and click **"Allow"**
10. Success! You're now connected!

---

## ✅ Verify Connection

After connecting, you should see:
- ✓ Green status indicator showing your email address
- ✓ Real emails from your inbox loading
- ✓ Ability to reply to emails
- ✓ Ability to compose new emails

---

## 🔄 Connect Second Account

To monitor both accounts, you'll need to:

1. **Option A: Use the app's account switcher** (if implemented)
2. **Option B: Create a second OAuth Client ID** for the other account
3. **Option C: Use Gmail's "Check mail from other accounts" feature**
   - In Gmail settings, add one account to check the other
   - Then you only need one connection

---

## 🎯 What You Can Do Now

### View Real Emails
- See all emails from your connected account
- Read full email content
- View attachments
- See sender information

### Reply as CEO
- Click any email
- Click **"Reply as CEO"**
- Choose from professional templates
- Customize the message
- Send directly from your Gmail

### Compose Marketing Emails
- Click **"✉ Compose"** button
- Write your marketing message
- Add recipients
- Send professionally

### Monitor Google Sheets
- View marketing data in real-time
- Track HR & Finance metrics
- See live updates

---

## 🐛 Common Issues & Solutions

### Issue: "Token client not initialized"
**Solution:**
- Refresh the page
- Check browser console for errors
- Verify `.env` file has correct Client ID
- Make sure you redeployed after adding Client ID

### Issue: "Pop-up was blocked"
**Solution:**
- Allow pop-ups for your site in browser settings
- Try a different browser
- Disable pop-up blocker temporarily

### Issue: "Access was denied"
**Solution:**
- Try connecting again
- Make sure you click "Allow" on all permission requests
- Check that your email is added as a test user in OAuth consent screen

### Issue: Emails not loading
**Solution:**
- Check that you granted Gmail API permissions
- Verify the account you connected has emails
- Try disconnecting and reconnecting

### Issue: Can't send emails
**Solution:**
- Make sure you granted `gmail.send` permission
- Check that you're sending from the connected account
- Verify recipient email addresses are correct

---

## 🔐 Security Information

- Your OAuth Client ID is safe to expose in frontend code
- Access tokens are stored in browser memory only (not persistent)
- No passwords are stored anywhere
- All communication with Google is encrypted (HTTPS)
- You can revoke access anytime from your Google Account settings

---

## 📞 Need Help?

1. **Check the Setup Wizard** in the app
2. **Review this guide** step by step
3. **Check browser console** (F12) for error messages
4. **Verify Google Cloud Console** configuration
5. **Contact support** if issues persist

---

## 🎉 Success!

Once connected, you have:
- ✅ Real-time email monitoring
- ✅ Professional CEO-style replies
- ✅ Marketing email capabilities
- ✅ Google Sheets integration
- ✅ 24/7 operations center

**Your Live Operations Center is now fully operational!**

---

## 📚 Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Last Updated**: 2026
**App Version**: 1.0.0
**Live URL**: https://operations-management-neas.netlify.app/
