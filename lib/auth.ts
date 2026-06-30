import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Email from "next-auth/providers/email"
import { prisma } from "@/lib/prisma"

const authConfig = {
  trustHost: true,
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
  },
  callbacks: {
    async session({ session, user }: any) {
      if (session) {
        session.user.id = user.id
      }
      return session
    },
  },
}

export const { handlers, auth } = NextAuth(authConfig)
