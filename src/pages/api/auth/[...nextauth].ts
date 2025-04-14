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
          scope: "setup.read offline_access",
          response_type: "code",
        },
      },
      token: {
        url: "https://identity.apaleo.com/connect/token",
        async request({ client, params }) {
          console.log("Token request params:", params);
          const response = await fetch("https://identity.apaleo.com/connect/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: client.clientId as string,
              client_secret: client.clientSecret as string,
              code: params.code as string,
              redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/apaleo`,
            }).toString(),
          });

          const tokens: ApaleoTokens = await response.json();
          console.log("Token response:", tokens);
          
          if (!response.ok) {
            console.error("Token error:", tokens);
            throw new Error("Failed to get access token");
          }

          return {
            tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_in: tokens.expires_in,
              token_type: tokens.token_type,
            }
          };
        },
      },
      userinfo: {
        url: "https://app.apaleo.com/api/account/v1/accounts/current",
        async request({ tokens }) {
          console.log("Userinfo request with token:", tokens.access_token);
          const response = await fetch(
            "https://app.apaleo.com/api/account/v1/accounts/current",
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );
          
          if (!response.ok) {
            console.error("Userinfo error:", await response.text());
            throw new Error("Failed to get user info");
          }

          return response.json();
        },
      },
      profile(profile: ApaleoProfile, tokens: any) {
        console.log("Profile data:", profile, "Tokens:", tokens);
        const expiresAt = Math.floor(Date.now() / 1000 + (tokens.expires_in as number));
        
        return {
          id: profile.id,
          name: profile.name || "Apaleo User",
          email: profile.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        } as User;
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
          expiresAt: account.expires_at,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        const response = await fetch("https://identity.apaleo.com/connect/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.APALEO_CLIENT_ID as string,
            client_secret: process.env.APALEO_CLIENT_SECRET as string,
            refresh_token: token.refreshToken as string,
          }).toString(),
        });

        const tokens: ApaleoTokens = await response.json();
        console.log("Token refresh response:", tokens);

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      console.log("Session callback:", { session, token });
      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        user: token.user as User,
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