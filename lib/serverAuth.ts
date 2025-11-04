import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getServerAuthSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getServerAuthSession()
  return session?.user
}

export async function requireAuth() {
  const session = await getServerAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  return session.user
}
