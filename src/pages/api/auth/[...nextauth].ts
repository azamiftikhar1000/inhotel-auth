import NextAuth, { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

interface ApaleoProfile {
  id: string;
  name?: string;
  email?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "apaleo",
      name: "Apaleo",
      type: "oauth",
      clientId: process.env.APALEO_CLIENT_ID,
      clientSecret: process.env.APALEO_CLIENT_SECRET,
      wellKnown: "https://identity.apaleo.com/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "setup.read offline_access",
        },
      },
      token: "https://identity.apaleo.com/connect/token",
      userinfo: "https://app.apaleo.com/api/account/v1/accounts/current",
      profile(profile: ApaleoProfile): User {
        return {
          id: profile.id,
          name: profile.name || "Apaleo User",
          email: profile.email,
        };
      },
    } as OAuthConfig<ApaleoProfile>,
  ],
  callbacks: {
    async jwt({ token, account, user }) {
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
          }),
        });

        const tokens = await response.json();

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
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 