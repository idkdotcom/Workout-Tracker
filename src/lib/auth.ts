import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', credentials);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await pool.connect();
        try {
          // Check if user exists
          const result = await client.query(
            `SELECT id, email, name, password FROM users WHERE email = $1`,
            [credentials.email]
          );

          if (result.rows.length === 0) {
            console.log('No user found, creating new user for', credentials.email);
            // User doesn't exist, create new user
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            const newUserResult = await client.query(
              `INSERT INTO users (id, email, name, password)
               VALUES ($1, $2, $3, $4)
               RETURNING id, email, name`,
              [randomUUID(), credentials.email, credentials.email.split("@")[0], hashedPassword]
            );

            return {
              id: newUserResult.rows[0].id,
              email: newUserResult.rows[0].email,
              name: newUserResult.rows[0].name,
            };
          }

          // User exists, verify password
          const user = result.rows[0];
          if (!user.password) {
            // User exists but has no password (migrated from Google OAuth)
            // Set password for existing user
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            await client.query(
              `UPDATE users SET password = $1 WHERE id = $2`,
              [hashedPassword, user.id]
            );
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        } finally {
          client.release();
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email!;
        token.name = user.name!;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};
