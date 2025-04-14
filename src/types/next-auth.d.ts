import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }

  interface Session {
    accessToken?: string;
    error?: string;
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    user?: User;
  }
} 