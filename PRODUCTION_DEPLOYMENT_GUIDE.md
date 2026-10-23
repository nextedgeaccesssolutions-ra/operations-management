# NEAS Operations Management System - Production Deployment Guide

**Version:** 1.0.0  
**Date:** 23 October 2026  
**Status:** Production Ready  
**Deployment Platform:** Netlify  

---

## 1. PRE-DEPLOYMENT CHECKLIST

### 1.1 Required Accounts and Access

Before deployment, ensure you have:

- [ ] **Netlify Account** - With access to the NEAS site
- [ ] **Google Cloud Console** - Owner or Editor role
- [ ] **Domain Access** - If using custom domain
- [ ] **Environment Variables** - All required values prepared

### 1.2 Required Configuration

**Google Cloud Console Setup:**

1. Go to https://console.cloud.google.com/
2. Create new project or select existing: "NEAS Operations"
3. Enable required APIs:
   - Gmail API
   - Google Sheets API (optional)
   - Google Drive API (optional)

4. Configure OAuth consent screen:
   - User type: External
   - App name: NEAS Operations Management
   - User support email: your-email@company.com
   - Developer contact: your-email@company.com
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/spreadsheets.readonly` (optional)
   - Add test users:
     - info.nextedgeaccesssolutions@gmail.com

5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: NEAS Operations Frontend
   - Authorized JavaScript origins:
     ```
     https://your-site.netlify.app
     https://deploy-preview-3--operations-management-neas.netlify.app
     http://localhost:3000
     http://localhost:5173
     ```
   - Authorized redirect URIs:
     ```
     https://your-site.netlify.app/**
     ```
   - Click "Create"
   - **Copy the Client ID** (you'll need this)

### 1.3 Environment Variables

Prepare these values:

```env
# REQUIRED - Gmail OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# OPTIONAL - For real Refrens data
VITE_REFRENS_API_KEY=your-refrens-api-key

# OPTIONAL - For real Google Sheets data
VITE_GOOGLE_SHEETS_API_KEY=your-sheets-api-key

# OPTIONAL - For Supabase backend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**⚠️ IMPORTANT:** 
- Never commit `.env` file to Git
- Never expose API keys in frontend code
- Use Netlify environment variables for production

---

## 2. DEPLOYMENT PROCEDURES

### 2.1 Initial Deployment to Netlify

**Option A: Netlify CLI (Recommended)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Set environment variables
netlify env:set VITE_GOOGLE_CLIENT_ID your-client-id.apps.googleusercontent.com

# Deploy to production
netlify deploy --prod --dir=dist
```

**Option B: Netlify Dashboard**

1. Go to https://app.netlify.com/
2. Select your NEAS site
3. Go to "Deploys" tab
4. Drag and drop the `dist` folder
5. Wait for deployment to complete (~30 seconds)

**Option C: Git Integration**

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Production deployment v1.0.0"

# Push to main branch
git push origin main

# Netlify will auto-deploy
```

### 2.2 Preview Deployment

For testing before production:

```bash
# Deploy to preview
netlify deploy --dir=dist

# Or use Netlify dashboard drag-and-drop
```

Preview URL will be: `https://deploy-preview-X--your-site.netlify.app/`

### 2.3 Production Deployment Verification

After deployment, verify:

1. **Site Loads**
   - [ ] Homepage displays correctly
   - [ ] No console errors
   - [ ] All assets load (CSS, JS, images)
   - [ ] Responsive design works

2. **Authentication Works**
   - [ ] Login page accessible
   - [ ] Demo login works (demo@neas.co / demo123)
   - [ ] Session persists across refresh
   - [ ] Logout works correctly

3. **Navigation Works**
   - [ ] All 26 modules accessible
   - [ ] Sidebar navigation functional
   - [ ] Breadcrumbs work
   - [ ] Deep links work

4. **Core Features Work**
   - [ ] Task creation and management
   - [ ] Approval workflows
   - [ ] Email center loads
   - [ ] Data persists across refresh
   - [ ] Audit logging active

5. **Gmail OAuth (If Configured)**
   - [ ] Gmail Authorization page loads
   - [ ] "Authorize Gmail" button works
   - [ ] OAuth popup opens
   - [ ] Identity verification works
   - [ ] Email sync completes
   - [ ] Real emails display

---

## 3. GMAIL OAUTH CONFIGURATION

### 3.1 Step-by-Step Setup

**Step 1: Google Cloud Console**

1. Navigate to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Verify settings:
   - Application type: Web application
   - Authorized JavaScript origins include your Netlify URL
   - Authorized redirect URIs include your Netlify URL

**Step 2: Netlify Environment Variables**

1. Go to your Netlify site dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Add new variable:
   - Key: `VITE_GOOGLE_CLIENT_ID`
   - Value: Your OAuth Client ID
   - Scope: All deploy contexts (or production only)
4. Save and redeploy

**Step 3: Test OAuth Flow**

1. Login to your deployed application
2. Navigate to "📧 Gmail Authorization"
3. Click "🔐 Authorize Gmail"
4. Sign in with: info.nextedgeaccesssolutions@gmail.com
5. Grant read-only access
6. Verify identity matches
7. Click "🔄 Sync Now"
8. Verify real emails display

### 3.2 Troubleshooting OAuth

**Issue: "Identity mismatch" error**
- **Cause:** Authorized different Gmail account
- **Fix:** Sign out of Google, sign in with correct account

**Issue: "OAuth client not configured" error**
- **Cause:** Missing VITE_GOOGLE_CLIENT_ID
- **Fix:** Add environment variable in Netlify, redeploy

**Issue: "Access denied" error**
- **Cause:** Google Cloud Console not configured correctly
- **Fix:** Verify authorized origins match your Netlify URL exactly

**Issue: Popup blocked**
- **Cause:** Browser blocking OAuth popup
- **Fix:** Allow popups for your Netlify domain

---

## 4. POST-DEPLOYMENT VERIFICATION

### 4.1 Smoke Tests

Run these tests after every deployment:

**Test 1: Application Loads**
```
1. Open production URL
2. Verify homepage displays
3. Check browser console for errors
4. Verify all modules accessible
```

**Test 2: Authentication**
```
1. Login with demo credentials
2. Verify dashboard loads
3. Logout and verify redirect
4. Login again and verify session
```

**Test 3: Core Workflows**
```
1. Create a test task
2. Assign to an agent
3. Complete the task
4. Verify audit log entry
5. Verify data persists after refresh
```

**Test 4: Gmail Integration**
```
1. Navigate to Gmail Authorization
2. Verify connection status
3. If authorized, sync emails
4. Verify emails display
5. Test email classification
```

**Test 5: Data Persistence**
```
1. Create test data in multiple modules
2. Refresh the page
3. Verify all data persists
4. Check localStorage (dev tools)
5. Verify audit logs
```

### 4.2 Performance Tests

**Load Time:**
- [ ] Initial load < 2 seconds
- [ ] Module switch < 100ms
- [ ] Data persistence < 50ms

**Memory:**
- [ ] No memory leaks after 10 minutes
- [ ] Memory usage < 200 MB
- [ ] No console warnings

**Network:**
- [ ] No failed requests
- [ ] API calls optimized
- [ ] Caching working correctly

### 4.3 Security Tests

**Authentication:**
- [ ] No credentials in source code
- [ ] No tokens in localStorage
- [ ] Session management secure
- [ ] Logout clears session

**Authorization:**
- [ ] Role-based access enforced
- [ ] Approval workflows working
- [ ] Audit logging active
- [ ] No unauthorized access

**Data Protection:**
- [ ] No PII in logs
- [ ] Error messages safe
- [ ] Input validation active
- [ ] Output sanitization working

---

## 5. MONITORING AND MAINTENANCE

### 5.1 Netlify Monitoring

**Build Logs:**
- Monitor build success/failure
- Check for warnings
- Review deployment status

**Analytics:**
- Track page views
- Monitor performance
- Identify issues

**Functions:**
- Monitor serverless function usage
- Track execution times
- Review errors

### 5.2 Application Monitoring

**Console Logging:**
- Review browser console for errors
- Check network tab for failed requests
- Monitor localStorage usage

**Audit Logs:**
- Review audit log entries
- Track user actions
- Monitor system events

**Performance:**
- Monitor load times
- Track memory usage
- Review bundle size

### 5.3 Maintenance Tasks

**Weekly:**
- [ ] Review audit logs
- [ ] Check for errors
- [ ] Monitor performance
- [ ] Update dependencies

**Monthly:**
- [ ] Security review
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Backup verification

**Quarterly:**
- [ ] Full security audit
- [ ] Performance benchmark
- [ ] Dependency major updates
- [ ] Disaster recovery test

---

## 6. ROLLBACK PROCEDURES

### 6.1 When to Rollback

Rollback if:
- Critical bugs discovered
- Security vulnerabilities found
- Performance degradation
- Data corruption
- Integration failures

### 6.2 Rollback Steps

**Option A: Netlify Deploy Rollback**

1. Go to Netlify site dashboard
2. Navigate to "Deploys" tab
3. Find previous successful deploy
4. Click "Publish deploy" or "Rollback to this deploy"
5. Verify rollback successful

**Option B: Git Rollback**

```bash
# Find previous good commit
git log --oneline

# Revert to previous commit
git revert <commit-hash>

# Push to trigger redeploy
git push origin main
```

**Option C: Manual Rollback**

```bash
# Checkout previous version
git checkout <previous-tag>

# Rebuild
npm run build

# Redeploy
netlify deploy --prod --dir=dist
```

### 6.3 Post-Rollback Verification

After rollback:
1. Verify site loads correctly
2. Test core functionality
3. Check data integrity
4. Review error logs
5. Confirm issue resolved

---

## 7. TROUBLESHOOTING GUIDE

### 7.1 Common Issues

**Issue: Site shows blank page**
- **Cause:** Build failed or missing assets
- **Fix:** Check build logs, verify dist folder exists, redeploy

**Issue: Modules not loading**
- **Cause:** JavaScript errors
- **Fix:** Check browser console, review error messages, fix code

**Issue: Data not persisting**
- **Cause:** localStorage disabled or full
- **Fix:** Check browser settings, clear storage, verify persistence service

**Issue: Gmail OAuth fails**
- **Cause:** Missing or incorrect client ID
- **Fix:** Verify environment variable, check Google Cloud Console

**Issue: Slow performance**
- **Cause:** Large bundle or inefficient code
- **Fix:** Review bundle size, optimize code, enable caching

### 7.2 Debugging Tools

**Browser DevTools:**
- Console: Check for errors
- Network: Monitor API calls
- Application: Inspect localStorage
- Performance: Profile load times

**Netlify Dashboard:**
- Deploys: Review build logs
- Functions: Monitor serverless functions
- Analytics: Track usage patterns
- Logs: Review deployment logs

**Local Development:**
```bash
# Run development server
npm run dev

# Check TypeScript errors
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 8. SECURITY BEST PRACTICES

### 8.1 Environment Variables

**DO:**
- ✅ Use Netlify environment variables
- ✅ Prefix with `VITE_` for frontend access
- ✅ Keep secrets server-side only
- ✅ Rotate credentials regularly
- ✅ Use different values per environment

**DON'T:**
- ❌ Commit `.env` to Git
- ❌ Expose API keys in frontend
- ❌ Use same credentials across environments
- ❌ Share credentials in chat/email
- ❌ Hardcode secrets in source

### 8.2 OAuth Security

**DO:**
- ✅ Use minimum required scopes
- ✅ Verify identity on every callback
- ✅ Store tokens securely (memory only)
- ✅ Implement CSRF protection
- ✅ Log all OAuth events

**DON'T:**
- ❌ Store tokens in localStorage
- ❌ Request unnecessary permissions
- ❌ Skip identity verification
- ❌ Expose tokens in logs
- ❌ Use demo accounts in production

### 8.3 Data Protection

**DO:**
- ✅ Validate all inputs
- ✅ Sanitize all outputs
- ✅ Use parameterized queries
- ✅ Encrypt sensitive data
- ✅ Implement access controls

**DON'T:**
- ❌ Trust user input
- ❌ Display raw error messages
- ❌ Store passwords in plain text
- ❌ Log sensitive information
- ❌ Expose internal IDs

---

## 9. CONTACT AND SUPPORT

### 9.1 Technical Support

**Development Team:**
- Senior Full-Stack Architect
- DevOps Engineer
- Security Specialist

**Netlify Support:**
- Documentation: https://docs.netlify.com/
- Community: https://community.netlify.com/
- Status: https://www.netlifystatus.com/

**Google Cloud Support:**
- Documentation: https://cloud.google.com/docs
- Console: https://console.cloud.google.com/
- Support: https://cloud.google.com/support

### 9.2 Emergency Contacts

**Production Issues:**
1. Check Netlify deploy logs
2. Review browser console errors
3. Verify environment variables
4. Contact development team

**Security Issues:**
1. Revoke compromised credentials
2. Rotate all API keys
3. Review audit logs
4. Contact security team

**Data Issues:**
1. Check localStorage integrity
2. Review persistence service logs
3. Verify data backups
4. Contact database team

---

## 10. DEPLOYMENT SIGN-OFF

### 10.1 Pre-Deployment Approval

**Required Approvals:**
- [ ] Technical Lead - Code review complete
- [ ] Security Lead - Security review complete
- [ ] Product Owner - Requirements verified
- [ ] QA Lead - Testing complete

### 10.2 Post-Deployment Verification

**Verification Checklist:**
- [ ] Site loads correctly
- [ ] All modules functional
- [ ] Authentication working
- [ ] Gmail OAuth configured
- [ ] Data persisting
- [ ] Performance acceptable
- [ ] Security compliant
- [ ] Monitoring active

### 10.3 Deployment Record

**Deployment Details:**
- Version: 1.0.0
- Date: [Deployment Date]
- Deploy ID: [Netlify Deploy ID]
- Commit: [Git Commit Hash]
- Deployed By: [Deployer Name]
- Verified By: [Verifier Name]

**Sign-Off:**
- Developer: _________________ Date: _______
- QA Lead: _________________ Date: _______
- Product Owner: _________________ Date: _______

---

## APPENDIX A: ENVIRONMENT VARIABLES REFERENCE

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Gmail OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `VITE_REFRENS_API_KEY` | No | Refrens API key | `refrens-api-key-here` |
| `VITE_GOOGLE_SHEETS_API_KEY` | No | Google Sheets API key | `sheets-api-key-here` |
| `VITE_SUPABASE_URL` | No | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key | `eyJhbGci...` |

## APPENDIX B: NETLIFY CONFIGURATION

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "DENY"
```

## APPENDIX C: QUICK DEPLOYMENT COMMANDS

```bash
# Development
npm run dev

# Build
npm run build

# Type Check
npm run typecheck

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Set Environment Variable
netlify env:set VITE_GOOGLE_CLIENT_ID your-client-id

# View Deploy Logs
netlify logs

# Rollback
netlify rollback
```

---

**Document Version:** 1.0.0  
**Last Updated:** 23 October 2026  
**Next Review:** After first production deployment  
**Owner:** NEAS Development Team
