# InHotel Auth - Apaleo Integration

This is a Next.js application that implements OAuth authentication with Apaleo for InHotel.

## Features

- OAuth 2.0 authentication with Apaleo
- Token management (access and refresh tokens)
- Protected routes
- Modern UI with Tailwind CSS
- TypeScript support

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- An Apaleo account with API credentials

## Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:azamiftikhar1000/inhotel-auth.git
   cd inhotel-auth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```env
   APALEO_CLIENT_ID=your_client_id
   APALEO_CLIENT_SECRET=your_client_secret
   APALEO_REDIRECT_URI=http://localhost:3000/callback
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret

   # Public environment variables
   NEXT_PUBLIC_APALEO_CLIENT_ID=your_client_id
   NEXT_PUBLIC_APALEO_REDIRECT_URI=http://localhost:3000/callback
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm start` - Starts the production server
- `npm run lint` - Runs the linter

## OAuth Flow

1. User clicks "Sign In with Apaleo"
2. User is redirected to Apaleo login page
3. After successful login, Apaleo redirects back to the application
4. Application exchanges the authorization code for access and refresh tokens
5. User is authenticated and can access protected routes

## Environment Variables

- `APALEO_CLIENT_ID`: Your Apaleo client ID
- `APALEO_CLIENT_SECRET`: Your Apaleo client secret
- `APALEO_REDIRECT_URI`: The callback URL for OAuth (e.g., http://localhost:3000/callback)
- `NEXTAUTH_URL`: The base URL of your application
- `NEXTAUTH_SECRET`: A random string used to hash tokens and sign cookies
- `NEXT_PUBLIC_APALEO_CLIENT_ID`: Same as APALEO_CLIENT_ID (for client-side use)
- `NEXT_PUBLIC_APALEO_REDIRECT_URI`: Same as APALEO_REDIRECT_URI (for client-side use)

## Deployment

The application can be deployed to any platform that supports Next.js applications (Vercel, Netlify, etc.).

Remember to:
1. Set up the environment variables on your hosting platform
2. Update the redirect URIs in your Apaleo application settings
3. Update the `NEXTAUTH_URL` to match your production URL

## Security Considerations

- All sensitive information is stored server-side
- CSRF protection is implemented using state parameters
- Tokens are automatically refreshed when expired
- Environment variables are properly segregated between client and server

## ENV
https://inhotel-auth-4fbefd0bd04c.herokuapp.com/api/auth/callback/apaleo
APALEO_CLIENT_ID : KHWD-AC-INHOTEL_STAFF_ASSISTANT
APALEO_CLIENT_SECRET: 81ihwXZZL5rNt6XWxe01CBtsWHrwkd
