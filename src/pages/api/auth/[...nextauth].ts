import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "apaleo",
      name: "Apaleo",
      credentials: {
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.code) return null;

        try {
          // Exchange the authorization code for an access token
          const tokenResponse = await axios.post(
            "https://identity.apaleo.com/connect/token",
            new URLSearchParams({
              client_id: process.env.APALEO_CLIENT_ID!,
              client_secret: process.env.APALEO_CLIENT_SECRET!,
              grant_type: "authorization_code",
              code: credentials.code,
              redirect_uri: process.env.APALEO_REDIRECT_URI!,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          const { access_token, refresh_token, expires_in } = tokenResponse.data;

          // Get user info
          const userResponse = await axios.get(
            "https://app.apaleo.com/api/account/v1/accounts/current",
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          );

          return {
            id: userResponse.data.id || "user-id",
            name: userResponse.data.name || "Apaleo User",
            email: userResponse.data.email || "user@example.com",
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: Math.floor(Date.now() / 1000) + expires_in,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = user.expiresAt;
      }

      // Check if token is expired and refresh if needed
      if (token.expiresAt && Date.now() / 1000 > token.expiresAt) {
        try {
          const refreshResponse = await axios.post(
            "https://identity.apaleo.com/connect/token",
            new URLSearchParams({
              client_id: process.env.APALEO_CLIENT_ID!,
              client_secret: process.env.APALEO_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          const {
            access_token,
            refresh_token,
            expires_in,
          } = refreshResponse.data;

          token.accessToken = access_token;
          token.refreshToken = refresh_token || token.refreshToken;
          token.expiresAt = Math.floor(Date.now() / 1000) + expires_in;
        } catch (error) {
          console.error("Token refresh error:", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 