import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Credentials received:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        console.log('👤 User found:', { id: user?.id, email: user?.email, hasPasswordHash: !!user?.password_hash });

        if (!user || !user.password_hash) {
          console.log('❌ User not found or no password hash');
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        console.log('🔑 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('❌ Invalid password');
          return null
        }

        const result = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
        
        console.log('✅ Auth successful, returning:', result);
        return result;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const email = user.email as string | null
          const name = (user.name as string | null) ?? "User"
          if (!email) return true

          // Best-effort upsert; do not block sign-in if it fails
          const randomPassword = crypto.randomBytes(32).toString("hex")
          const randomHash = await bcrypt.hash(randomPassword, 10)
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: { email, name, password_hash: randomHash },
          })
          
          // Update the user object with the database ID
          ;(user as any).id = dbUser.id
        } catch (err) {
          // ignore and allow sign-in; oauth-bridge will handle creation
        }
        return true
      }
      if (account?.provider === "github") {
        return true
      }
      return true
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}