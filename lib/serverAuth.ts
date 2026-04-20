import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

// Check if a valid session exists
export async function hasValidSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__sso_session')?.value
    return !!sessionCookie
  } catch {
    return false
  }
}

// Get user from the database
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('__sso_user_id')?.value

    if (userIdCookie) {
      const user = await prisma.user.findUnique({
        where: { id: userIdCookie },
      })
      return user
    }

    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

async function resolveUserFromIdp(sessionCookie: string) {
  const idpServer = process.env.NEXT_PUBLIC_IDP_SERVER
  if (!idpServer) return null

  try {
    const res = await fetch(`${idpServer.replace(/\/$/, '')}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `__sso_session=${sessionCookie}`,
      },
      body: JSON.stringify({ session_id: sessionCookie }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const email: string | undefined = data?.user?.email
    if (!email) return null
    return await prisma.user.findUnique({ where: { email } })
  } catch {
    return null
  }
}

export async function requireAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__sso_session')?.value

  if (!sessionCookie) {
    throw new Error("Unauthorized")
  }

  const userIdCookie = cookieStore.get('__sso_user_id')?.value
  if (userIdCookie) {
    const user = await prisma.user.findUnique({ where: { id: userIdCookie } })
    if (user) return user
  }

  const user = await resolveUserFromIdp(sessionCookie)
  if (user) return user

  throw new Error("Unauthorized")
}

export async function getOrCreateUser(idpUser: { id?: string; email?: string; name?: string }) {
  try {
    if (!idpUser.email) {
      throw new Error("Email is required to create or find user")
    }

    // Try to find user by email
    let user = await prisma.user.findUnique({
      where: { email: idpUser.email },
    })

    // If not found, create a new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: idpUser.email,
          name: idpUser.name || "User",
        },
      })
    } else if (!user.name && idpUser.name) {
      // Update name if not set
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: idpUser.name },
      })
    }

    return user
  } catch (error) {
    console.error("Error getting or creating user:", error)
    return null
  }
}
