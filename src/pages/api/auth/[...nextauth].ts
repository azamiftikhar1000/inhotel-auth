import NextAuth, { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface ApaleoProfile {
  id: string;
  name?: string;
  email?: string;
}

interface ApaleoTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    {
      id: "apaleo",
      name: "Apaleo",
      type: "oauth",
      clientId: process.env.APALEO_CLIENT_ID,
      clientSecret: process.env.APALEO_CLIENT_SECRET,
      authorization: {
        url: "https://identity.apaleo.com/connect/authorize",
        params: {
          scope: "offline_access openid profile setup.read",
          response_type: "code",
          redirect_uri: "https://inhotel-auth-4fbefd0bd04c.herokuapp.com/api/auth/callback/apaleo",
          state: Math.random().toString(36).substring(7),
        },
      },
      token: {
        url: "https://identity.apaleo.com/connect/token",
        async request({ client, params }) {
          console.log("Token request params:", params);
          
          // Get credentials directly from environment
          const clientId = process.env.APALEO_CLIENT_ID;
          const clientSecret = process.env.APALEO_CLIENT_SECRET;
          
          console.log("Using client ID from env:", clientId);
          console.log("Client secret length from env:", clientSecret?.length || 0);
          
          try {
            // Create Basic Auth header
            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            console.log("Basic Auth header created (first 10 chars):", basicAuth.substring(0, 10) + "...");
            
            const response = await fetch("https://identity.apaleo.com/connect/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${basicAuth}`,
                "Accept": "application/json",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId as string,
                client_secret: clientSecret as string,
                code: params.code as string,
                redirect_uri: "https://inhotel-auth-4fbefd0bd04c.herokuapp.com/api/auth/callback/apaleo",
              }).toString(),
            });

            const tokens = await response.json();
            console.log("Token response status:", response.status);
            
            if (!response.ok) {
              console.error("Token error:", tokens);
              throw new Error(tokens.error_description || tokens.error || "Failed to get access token");
            }

            return {
              tokens: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.expires_in,
                token_type: tokens.token_type,
              }
            };
          } catch (error) {
            console.error("Exception during token exchange:", error);
            throw error;
          }
        },
      },
      userinfo: {
        url: "https://api.apaleo.com/v1/user/me",
        async request({ tokens }) {
          console.log("Userinfo request with token");
          try {
            const response = await fetch(
              "https://api.apaleo.com/v1/user/me",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                  Accept: "application/json",
                },
              }
            );
            
            if (!response.ok) {
              console.error("Userinfo error status:", response.status, "Error:", await response.text());
              return { id: "user", name: "Apaleo User" };
            }

            const profile = await response.json();
            console.log("Profile response received successfully");
            return profile;
          } catch (error) {
            console.error("Exception during userinfo request:", error);
            return { id: "user", name: "Apaleo User" };
          }
        },
      },
      profile(profile, tokens) {
        console.log("Profile data:", profile);
        
        return {
          id: profile.id || "apaleo-user",
          name: profile.name || "Apaleo User",
          email: profile.email,
          image: null,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000 + (account.expires_in as number)),
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        console.log("Refreshing access token");
        // Create Basic Auth header
        const basicAuth = Buffer.from(`${process.env.APALEO_CLIENT_ID}:${process.env.APALEO_CLIENT_SECRET}`).toString('base64');
        
        const response = await fetch("https://identity.apaleo.com/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${basicAuth}`,
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }).toString(),
        });

        const tokens = await response.json();
        console.log("Token refresh response status:", response.status);

        if (!response.ok) {
          console.error("Token refresh error:", tokens);
          throw new Error(tokens.error_description || tokens.error || "Failed to refresh token");
        }

        console.log("Successfully refreshed token");
        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        // Return previous token with error
        return { 
          ...token, 
          error: "RefreshAccessTokenError" 
        };
      }
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signout",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 