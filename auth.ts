/**
 * auth.ts
 *
 * NextAuth v5 configuration with:
 *  - JWT strategy (no DB required)
 *  - 8-hour session / token max-age
 *  - Server-side logout invalidation via a `sessionVersion` counter stored
 *    in data/session-version.json. On sign-out the counter increments;
 *    tokens issued before the current version are rejected by the JWT callback.
 *
 * SETUP: make sure data/ is in .gitignore.
 *
 * Environment variables required:
 *   NEXTAUTH_SECRET        – random secret for signing JWTs (run: openssl rand -base64 32)
 *   ADMIN_USERNAME          – admin login username
 *   ADMIN_PASSWORD_HASH_B64 – base64-encoded bcrypt hash of admin password
 *                             (base64 avoids dotenv mangling the bcrypt hash's `$` characters)
 *                             Generate with:
 *                             node -e "require('bcryptjs').hash('yourpassword',12).then(h => console.log(Buffer.from(h).toString('base64')))"
 */

import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// ── Session version store (lightweight server-side invalidation) ───────────────
const VERSION_FILE = path.join(process.cwd(), 'data', 'session-version.json');

function readSessionVersion(): number {
  try {
    const raw = fs.readFileSync(VERSION_FILE, 'utf-8');
    return (JSON.parse(raw) as { version: number }).version ?? 1;
  } catch {
    return 1;
  }
}

function incrementSessionVersion(): number {
  const next = readSessionVersion() + 1;
  fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
  fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: next }), 'utf-8');
  return next;
}

// ── Auth config ───────────────────────────────────────────────────────────────
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours in seconds

export const config: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        const expectedUsername = process.env.ADMIN_USERNAME;
        const expectedHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;

        if (!expectedUsername || !expectedHashB64) {
          console.error(
            '[auth] ADMIN_USERNAME or ADMIN_PASSWORD_HASH_B64 env vars are not set.',
          );
          return null;
        }

        const expectedHash = Buffer.from(expectedHashB64, 'base64').toString('utf-8');

        if (username !== expectedUsername) return null;

        const valid = await bcrypt.compare(password, expectedHash);
        if (!valid) return null;

        const currentVersion = readSessionVersion();

        return {
          id: 'admin',
          name: username,
          // Embed the current session version so we can validate it later
          sessionVersion: currentVersion,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },

  jwt: {
    maxAge: SESSION_MAX_AGE,
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, embed issuedAt and sessionVersion into the token
      if (user) {
        token.issuedAt = Math.floor(Date.now() / 1000);
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 1;
      }

      // On every request, check the token's sessionVersion against the server's
      // current version. If the server version is higher (admin signed out and
      // version was incremented), reject this token.
      const currentVersion = readSessionVersion();
      if ((token.sessionVersion as number) < currentVersion) {
        // Returning null invalidates the session
        return null as unknown as typeof token;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  events: {
    /**
     * On sign-out, increment the session version so all existing JWTs
     * become invalid on their next request — true server-side logout.
     */
    async signOut() {
      incrementSessionVersion();
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
