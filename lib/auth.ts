import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Email from "next-auth/providers/email"
import { prisma } from "@/lib/prisma"

let _resend: any = null
function getResend(): any {
  if (!_resend) {
    const { Resend: R } = require("resend")
    _resend = new R(process.env.RESEND_API_KEY)
  }
  return _resend
}

const authConfig = {
  trustHost: true,
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      server: { host: "localhost", port: 25, auth: { user: "dummy", pass: "dummy" } },
      sendVerificationRequest: async ({ identifier: to, url }) => {
        const { error } = await getResend().emails.send({
          from: `LaVerdi <${process.env.EMAIL_FROM || 'noreply@laverdi.tech'}>`,
          to,
          subject: "Sign in to LaVerdi",
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#d4d4d8;padding:40px 24px">
              <div style="max-width:480px;margin:0 auto;text-align:center">
                <h1 style="color:#fff;font-size:24px;margin:0 0 8px">Sign in to LaVerdi</h1>
                <p style="color:#a1a1aa;font-size:15px;margin:0 0 32px">Click the button below to sign in.</p>
                <a href="${url}" style="display:inline-block;background:#fff;color:#000;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none">Sign In</a>
                <p style="color:#52525b;font-size:12px;margin-top:32px">If you didn't request this email, you can ignore it.</p>
              </div>
            </body>
            </html>
          `,
        })
        if (error) {
          console.error("Resend verification email failed:", error)
          throw new Error("Failed to send verification email")
        }
      },
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
