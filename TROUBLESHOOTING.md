# 🔧 Troubleshooting: "Connecting..." Issue

## Problem
The app shows "Connecting..." but never completes the connection to Google.

## Root Cause
The Google OAuth authentication flow requires:
1. A popup window to open
2. User to authenticate in the popup
3. Google to send the token back to the parent window
4. The app to receive and process the token

If any step fails, the connection gets stuck.

---

## ✅ Solutions (Try in Order)

### Solution 1: Allow Pop-ups (Most Common Issue)

**Chrome:**
1. Look at the address bar - if you see a popup blocker icon, click it
2. Select "Always allow pop-ups from [your-site]"
3. Click "Done"
4. Try connecting again

**Firefox:**
1. Look at the address bar for the popup blocker icon
2. Click the icon → "Options" → "Allow"
3. Try connecting again

**Safari:**
1. Go to Safari → Preferences → Websites → Pop-up Windows
2. Find your site and set to "Allow"
3. Try connecting again

**Edge:**
1. Click the popup blocker icon in address bar
2. Select "Always allow"
3. Try connecting again

---

### Solution 2: Hard Refresh the Page

Sometimes the Google API scripts don't load properly.

**Steps:**
1. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. Wait for the page to fully reload
3. Try connecting again

---

### Solution 3: Clear Browser Cache and Cookies

**Chrome:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files" and "Cookies and other site data"
3. Time range: "All time"
4. Click "Clear data"
5. Close and reopen the browser
6. Try connecting again

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache" and "Cookies"
3. Time range: "Everything"
4. Click "Clear Now"
5. Restart Firefox
6. Try connecting again

---

### Solution 4: Use Incognito/Private Mode

This rules out browser extensions and cached data.

**Chrome:**
1. Press `Ctrl + Shift + N`
2. Go to your app URL
3. Try connecting

**Firefox:**
1. Press `Ctrl + Shift + P`
2. Go to your app URL
3. Try connecting

**Safari:**
1. Press `Cmd + Shift + N`
2. Go to your app URL
3. Try connecting

---

### Solution 5: Check Browser Console for Errors

**Steps:**
1. Press `F12` to open Developer Tools
2. Go to the "Console" tab
3. Click "Connect Google"
4. Look for error messages (red text)
5. Take a screenshot of the errors

**Common Errors:**

**Error: "popup_closed_by_user"**
- **Cause:** You closed the Google sign-in window
- **Solution:** Try again and complete the authentication

**Error: "access_denied"**
- **Cause:** You clicked "Deny" on the permissions screen
- **Solution:** Try again and click "Allow"

**Error: "popup_blocked"**
- **Cause:** Browser blocked the popup
- **Solution:** Allow pop-ups (see Solution 1)

**Error: "invalid_client"**
- **Cause:** OAuth Client ID is incorrect
- **Solution:** Verify the Client ID in Google Cloud Console

**Error: "origin_mismatch"**
- **Cause:** Your site URL is not in the authorized origins
- **Solution:** Add your URL to Google Cloud Console (see below)

---

### Solution 6: Verify Google Cloud Console Configuration

**Steps:**

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth Client ID
5. Check these settings:

**Application type:** Web application

**Authorized JavaScript origins:**
```
http://localhost:5173
https://operations-management-neas.netlify.app
```

**Important:** The URLs must match EXACTLY (including https vs http, and no trailing slashes)

6. If you need to add your URL:
   - Click "+ ADD URI"
   - Enter your exact site URL
   - Click "Save"
   - Wait 5 minutes for changes to propagate
   - Try connecting again

---

### Solution 7: Check OAuth Consent Screen

**Steps:**

1. Go to "APIs & Services" → "OAuth consent screen"
2. Verify these settings:
   - **User type:** External
   - **App name:** NEAS Operations Center (or similar)
   - **User support email:** Your email
   - **Developer contact:** Your email

3. Go to "Test users" section
4. Verify your Gmail accounts are added:
   - `info.nextedgeaccesssolutions@gmail.com`
   - `nextedgeaccesssolutions@gmail.com`

5. If not added:
   - Click "+ ADD USERS"
   - Add your Gmail addresses
   - Click "ADD"
   - Try connecting again

---

### Solution 8: Try a Different Browser

Some browsers have stricter security policies.

**Recommended browsers (in order):**
1. Chrome (most compatible)
2. Firefox
3. Edge
4. Safari (may require extra settings)

---

### Solution 9: Disable Browser Extensions

Some extensions (ad blockers, privacy tools) can interfere with OAuth.

**Steps:**
1. Disable all extensions temporarily
2. Try connecting again
3. If it works, re-enable extensions one by one to find the culprit
4. Add your site to the extension's whitelist

---

### Solution 10: Check Network/Firewall

**Corporate/School Networks:**
- Some networks block OAuth popups
- Try using a personal network or mobile hotspot

**VPN:**
- Disconnect VPN temporarily
- Try connecting again

**Antivirus:**
- Some antivirus software blocks OAuth
- Temporarily disable web protection
- Try connecting again

---

## 🔍 Debug Checklist

Before trying to connect, verify:

- [ ] Pop-ups are allowed for the site
- [ ] Browser cache is cleared
- [ ] Google Cloud Console has correct authorized origins
- [ ] Your email is added as a test user
- [ ] OAuth Client ID is correct in the app
- [ ] No browser extensions are blocking
- [ ] Internet connection is stable
- [ ] Using a supported browser (Chrome/Firefox/Edge)

---

## 📋 Expected Flow

When you click "Connect Google", here's what should happen:

1. **Button changes to:** "⏳ Connecting... (Check popup)"
2. **Google popup opens** with sign-in screen
3. **You select your Google account**
4. **Warning appears:** "Google hasn't verified this app"
   - Click "Advanced"
   - Click "Go to NEAS Operations Center (unsafe)"
5. **Permissions screen appears**
   - Review the permissions
   - Click "Allow" or "Continue"
6. **Popup closes automatically**
7. **Button changes to:** "✓ Connected"
8. **Your email appears** in the status
9. **Emails start loading**

**If it gets stuck at step 1:**
- Popup was blocked → Allow pop-ups
- Google API didn't load → Hard refresh

**If it gets stuck at step 2-5:**
- You need to interact with the popup
- Don't close it until authentication is complete

**If it gets stuck at step 6:**
- Token wasn't received → Try again
- Check browser console for errors

---

## 🎯 Quick Fix (Try This First)

1. **Open Chrome** (or your preferred browser)
2. **Go to:** https://operations-management-neas.netlify.app/
3. **Allow pop-ups** for the site (check address bar)
4. **Login:** `demo@neas.co` / `demo123`
5. **Click:** "🚀 Live Ops Center"
6. **Click:** "🔗 Connect Google"
7. **Watch for popup** - it should appear immediately
8. **Complete authentication** in the popup
9. **Wait for connection** to complete

**If popup doesn't appear:**
- Check address bar for popup blocker icon
- Click it and allow pop-ups
- Try again

---

## 📞 Still Not Working?

If you've tried all solutions and it's still stuck:

1. **Open browser console** (F12)
2. **Go to Console tab**
3. **Click "Connect Google"**
4. **Copy any error messages** (red text)
5. **Take a screenshot**
6. **Check these:**
   - Is the popup appearing?
   - Are you completing the Google sign-in?
   - What happens after you click "Allow"?

**Common patterns:**
- **No popup at all** → Popup blocker issue
- **Popup appears but closes immediately** → Token not being received
- **Popup stays open** → Waiting for user interaction
- **Error after authentication** → Configuration issue

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Popup opens immediately after clicking "Connect Google"
- ✅ You can see the Google sign-in screen
- ✅ You can select your account
- ✅ You see the permissions screen
- ✅ After clicking "Allow", the popup closes
- ✅ Button changes from "Connecting..." to "✓ Connected"
- ✅ Your email address appears in the status
- ✅ Emails start loading in the list

---

**Last Updated:** 2026
**App Version:** 1.0.0
**Live URL:** https://operations-management-neas.netlify.app/
