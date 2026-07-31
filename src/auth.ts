import {DrizzleAdapter} from "@auth/drizzle-adapter";
import {eq} from "drizzle-orm";
import NextAuth from "next-auth";
import type {Provider} from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {getDb} from "@/db";
import {accounts, authenticators, sessions, users, verificationTokens} from "@/db/schema";
import {getServerEnv, isGoogleAuthConfigured, requireAuthSecret} from "@/lib/env";
import {verifyPassword} from "@/server/auth/password";
import {loginSchema} from "@/server/auth/validation";

function buildProviders(): Provider[] {
  const env = getServerEnv();
  const providers: Provider[] = [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ];

  if (isGoogleAuthConfigured(env)) {
    providers.push(
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: false,
      }),
    );
  }

  return providers;
}

export const {handlers, auth, signIn, signOut} = NextAuth(() => {
  const env = getServerEnv();
  requireAuthSecret(env);

  return {
    trustHost: env.AUTH_TRUST_HOST !== "false",
    secret: env.AUTH_SECRET,
    ...(env.DATABASE_URL
      ? {
          adapter: DrizzleAdapter(getDb(), {
            usersTable: users,
            accountsTable: accounts,
            sessionsTable: sessions,
            verificationTokensTable: verificationTokens,
            authenticatorsTable: authenticators,
          }),
        }
      : {}),
    session: {
      /**
       * JWT is required for the Credentials provider in Auth.js.
       * Users/accounts still persist via the Drizzle adapter for OAuth and registration.
       */
      strategy: "jwt",
    },
    pages: {
      signIn: "/en/login",
      error: "/en/login",
    },
    providers: buildProviders(),
    callbacks: {
      async jwt({token, user}) {
        if (user?.id) {
          token.sub = user.id;
        }
        return token;
      },
      async session({session, token}) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
  };
});
