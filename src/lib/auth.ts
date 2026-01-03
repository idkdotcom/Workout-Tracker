import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return true;
    },

    async jwt({ token, account, profile }) {
      // Only run on initial sign-in
      if (account && profile) {
        const client = await pool.connect();
        try {
          const email = profile.email as string;
          const name = profile.name as string;

          const result = await client.query(
            `
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
            [randomUUID(), email, name]
          );

          token.userId = result.rows[0].id;
        } finally {
          client.release();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
