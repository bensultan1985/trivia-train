# Clerk Authentication Setup Guide

This application uses Clerk for authentication. Follow these steps to set up Clerk for your trivia-train application.

## 🔑 How Authentication Methods Appear

**Important:** The sign-in and sign-up pages use Clerk's prebuilt components that **automatically display** all authentication methods you enable in the Clerk Dashboard. 

- ✅ Enable a method in Clerk Dashboard → It appears on the login/register screens
- ❌ Don't enable a method → It won't appear

**You must configure these settings in your Clerk Dashboard for the authentication buttons to show up.**

## 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

## 2. Configure Authentication Methods

In your Clerk dashboard:

1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. Enable the following:
   - ✅ **Email address** (required)
   - ✅ **Username** (required - enables username/password login)
   - ✅ **Phone number** (required - enables phone authentication)

3. Navigate to **User & Authentication** → **Social Connections**
4. Enable:
   - ✅ **Google** (OAuth)
   - ✅ **X (Twitter)** (OAuth)

> **Important:** All five authentication methods (email, username/password, phone, Google, X) should be enabled to meet the requirements.

### Setting Up Google OAuth

1. In Clerk dashboard, click on **Google** under Social Connections
2. You have two options:
   - **Use Clerk's Development Keys** (quick start for testing)
   - **Use your own Google OAuth credentials** (required for production)
3. For custom setup:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs from Clerk dashboard
   - Copy Client ID and Client Secret to Clerk
4. Click **Save**

### Setting Up X (Twitter) OAuth

1. In Clerk dashboard, click on **X** under Social Connections
2. You have two options:
   - **Use Clerk's Development Keys** (quick start for testing)
   - **Use your own X OAuth credentials** (required for production)
3. For custom setup:
   - Go to [X Developer Portal](https://developer.twitter.com/)
   - Create a new app or use existing one
   - Get your API Key and API Secret Key
   - Add callback URLs from Clerk dashboard
   - Copy API Key and Secret to Clerk
4. Click **Save**

> **Tip:** Start with Clerk's development keys for quick testing, then switch to your own credentials before going to production.

## 3. Get Your API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy your keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

## 4. Set Environment Variables

Create a `.env.local` file in the root of your project:

```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/trivia_train"

# OpenAI API key for trivia generation
OPENAI_API_KEY="your-openai-api-key-here"

# Clerk authentication keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_key_here"

# Clerk redirect URLs (these are configured automatically)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

## 5. Configure User Profile Fields

In your Clerk dashboard:

1. Go to **User & Authentication** → **User Profile**
2. Ensure **First Name** is enabled (this is shown in the header)
3. Optionally enable **Last Name**

## 6. Customize Appearance (Optional)

You can customize the Clerk components to match your app's theme:

1. Go to **Customization** → **Theme**
2. Adjust colors, fonts, and layout to match your blue theme

## 7. Test Your Setup

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click **Register** to create a new account
4. Try signing in with all five authentication methods:
   - ✅ Email and password
   - ✅ Username and password
   - ✅ Phone number (SMS verification)
   - ✅ Google (if configured)
   - ✅ X/Twitter (if configured)
5. Verify your name appears in the header
6. Test the logout functionality

See `TESTING_AUTH.md` for detailed testing instructions for each authentication method.

## Authentication Features

✅ **Email/Password Authentication**: Users can register and login with email
✅ **Username/Password Authentication**: Users can register and login with username  
✅ **Phone Number Authentication**: Users can register and login with phone number
✅ **Google OAuth**: One-click sign-in with Google
✅ **X (Twitter) OAuth**: One-click sign-in with X/Twitter
✅ **User Profile Display**: Shows first name or username in header
✅ **Logout**: UserButton component with sign-out option
✅ **Protected Routes**: Middleware protects authenticated routes
✅ **Session Management**: Automatic session handling by Clerk

## Troubleshooting

### I Only See Email and Google on the Sign-In/Sign-Up Pages

**This is the most common issue!** The authentication buttons that appear on the sign-in and sign-up screens are controlled **entirely by your Clerk Dashboard settings**, not by code.

**Solution:**
1. Go to your Clerk Dashboard at https://dashboard.clerk.com
2. Select your application
3. Navigate to **Configure** → **User & Authentication** → **Email, Phone, Username**
4. Toggle ON:
   - **Email address** ✅
   - **Username** ✅ 
   - **Phone number** ✅ (This enables phone/SMS authentication)
5. Click **Save**
6. Navigate to **Configure** → **SSO Connections** (or **Social Connections**)
7. Enable:
   - **Google** ✅ (toggle ON or click to configure)
   - **X** ✅ (toggle ON or click to configure)
8. Click **Save**
9. Refresh your application - you should now see all authentication options!

**Note:** The prebuilt `<SignIn />` and `<SignUp />` components automatically detect and display all enabled authentication methods. There is no additional code configuration needed.

### Missing Environment Variables
If you see errors about missing Clerk keys, make sure:
- Your `.env.local` file exists in the root directory
- The keys are properly formatted (no quotes around values in the file)
- You've restarted your dev server after adding the keys

### Authentication Not Working
- Verify your Clerk application is active
- Check that your API keys are correct
- Ensure the authentication methods are enabled in Clerk dashboard
- Check the browser console for specific error messages

### OAuth Providers Not Showing
- Make sure you've enabled Google and X in the Clerk dashboard under SSO/Social Connections
- For development: You can use Clerk's shared OAuth credentials by simply toggling the provider ON
- For production: You'll need to configure your own OAuth credentials with Google and X developer consoles

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
