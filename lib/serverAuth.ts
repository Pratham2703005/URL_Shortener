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

export async function requireAuth() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__sso_session')?.value

    if (!sessionCookie) {
      throw new Error("Unauthorized")
    }

    // Try to get user from __sso_user_id cookie (set by sync-user endpoint)
    const userIdCookie = cookieStore.get('__sso_user_id')?.value

    if (userIdCookie) {
      const user = await prisma.user.findUnique({
        where: { id: userIdCookie },
      })

      if (user) {
        return user
      }
    }

    // As a last resort, throw error - user should have been synced
    // This shouldn't happen in normal flow since Providers handles sync
    throw new Error("User not found in database. Please try logging in again.")
  } catch (error) {
    throw error
  }
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
