# Testing the Clerk Authentication Integration

This document provides instructions for testing the Clerk authentication integration in the trivia-train application.

## Prerequisites

Before testing, you must:

1. ✅ Create a Clerk account at https://clerk.com
2. ✅ Create a new application in Clerk dashboard
3. ✅ Configure authentication methods (see CLERK_SETUP.md)
4. ✅ Add your Clerk API keys to `.env.local`

## Test Scenarios

### 1. Email/Password Registration and Login

**Test Registration:**
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click the **Register** button in the header
4. You should be taken to the Clerk sign-up page at `/sign-up`
5. Fill in the registration form:
   - Email address
   - Password (Clerk enforces password requirements)
   - First name (recommended - this will show in header)
   - Username (required field - enables username/password login)
6. Complete the email verification if required
7. After successful registration, you should be redirected to the home page

**Verify User Display:**
- Check the header - you should see: "Welcome, [YourFirstName]!" or "Welcome, [YourUsername]!"
- The UserButton (profile avatar) should appear in the header
- Login/Register buttons should be hidden

**Test Logout:**
1. Click the UserButton in the header
2. Click "Sign out"
3. You should be redirected to the home page
4. The header should now show Login/Register buttons instead of user info

**Test Login:**
1. Click the **Login** button
2. You should see the Clerk sign-in modal or page
3. Enter your email and password
4. After successful login, you should see your name in the header again

### 2. Username/Password Login (Required Feature)

**Test with Username:**
1. During registration, ensure you set up a username
2. After logging out, click Login
3. Try signing in with your username instead of email
4. Enter your password
5. Verify you can successfully log in with username + password
6. Check that your username or first name appears in the header

### 3. Phone Number Authentication (Required Feature)

**Prerequisites:**
- Phone number authentication must be enabled in Clerk dashboard
- SMS verification must be configured

**Test Registration with Phone:**
1. Navigate to the sign-up page
2. Choose "Use phone" option (if available as alternate method)
3. Enter your phone number with country code
4. Complete SMS verification by entering the code
5. Set your password and complete registration
6. Verify you're logged in and your info appears in header

**Test Login with Phone:**
1. Log out if logged in
2. Navigate to sign-in page
3. Enter your phone number
4. Enter your password (or complete SMS verification if configured)
5. Verify successful login

### 4. Google OAuth (Required Feature)

**Requirements:**
- Google OAuth must be enabled in Clerk dashboard
- You must configure the Google OAuth credentials

**Test:**
1. Navigate to sign-up or sign-in page
2. Click "Continue with Google"
3. Complete Google authentication flow
4. Verify you're redirected back and logged in
5. Check that your Google name appears in the header

### 5. X (Twitter) OAuth (Required Feature)

**Requirements:**
- X OAuth must be enabled in Clerk dashboard
- You must configure the X OAuth credentials (see CLERK_SETUP.md)

**Test:**
1. Navigate to sign-up or sign-in page
2. Look for "Continue with X" or Twitter icon button
3. Click the X/Twitter authentication button
4. Complete X authentication flow (authorize the app)
5. Verify you're redirected back to the app and logged in
6. Check that your X username or display name appears in the header

### 6. Old Route Redirects

**Test:**
1. Try navigating directly to `/login`
2. You should be automatically redirected to `/sign-in`
3. Try navigating to `/register`
4. You should be automatically redirected to `/sign-up`

### 7. Session Persistence

**Test:**
1. Log in to the application
2. Refresh the page
3. Verify you're still logged in (name shows in header)
4. Close the browser tab and reopen
5. Navigate to `http://localhost:3000`
6. Verify you're still logged in (session persisted)

### 8. Protected Routes (Future Enhancement)

Currently, all routes are public. In the future, you may want to:
- Protect certain training modes for logged-in users only
- Require authentication to save progress
- Add user-specific features

To test protected routes, remove routes from `isPublicRoute` in `middleware.ts` and verify authentication is required.

### 9. Training Pages Access

**Test Public Access:**
1. While logged out, click on any training mode
2. Verify you can access training without authentication
3. Complete some questions to verify functionality

**Test Logged-In Access:**
1. Log in to the application
2. Click on any training mode
3. Verify training works the same way when logged in

### 10. User Profile Information

**Test UserButton Features:**
1. While logged in, click the UserButton (avatar) in header
2. Explore the dropdown menu:
   - Manage account
   - Sign out
3. Click "Manage account" to test profile editing
4. Change your first name
5. Return to the app and verify the updated name shows in header

## Expected Behavior Summary

✅ **Registration:** Users can create accounts via email, username/password, phone, Google, or X
✅ **Login:** Users can log in with any configured method
✅ **User Display:** First name or username appears in header when logged in
✅ **Logout:** UserButton provides easy logout functionality
✅ **Redirects:** Old /login and /register routes redirect to new Clerk pages
✅ **Public Access:** Training modes remain accessible without login
✅ **Session Persistence:** Login sessions persist across page refreshes and browser restarts

## Troubleshooting

### Sign-up/Sign-in pages show errors
- Verify your Clerk API keys are correct in `.env.local`
- Check that authentication methods are enabled in Clerk dashboard
- Look at browser console for specific error messages

### User name not showing in header
- Ensure the user has a first name set in their profile
- If first name is not set, username should show instead
- Check Clerk dashboard to verify user profile data

### OAuth providers not appearing
- Verify Google/X OAuth is enabled in Clerk dashboard
- Complete the OAuth app configuration for each provider
- Check that OAuth credentials are correctly set up

### Redirects not working
- Clear browser cache and cookies
- Verify middleware.ts includes the old routes in public routes
- Check browser console for navigation errors

## Security Verification

After testing, verify:
- ✅ Passwords are never visible in network requests
- ✅ Session tokens are stored securely (HTTP-only cookies)
- ✅ Logout properly clears session data
- ✅ Protected routes (if any) require authentication
- ✅ User data is only visible to authenticated users

## Performance Check

- ✅ Sign-up and sign-in pages load quickly
- ✅ Authentication state updates immediately in header
- ✅ Page refreshes maintain authentication state without flicker

## Next Steps

After successful testing:
1. Deploy to production with production Clerk keys
2. Monitor authentication analytics in Clerk dashboard
3. Consider enabling additional features:
   - Multi-factor authentication (MFA)
   - Social login with additional providers
   - Organization/team features
   - Custom email templates
