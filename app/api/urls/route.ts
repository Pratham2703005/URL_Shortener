import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/serverAuth"
import { generateShortCode, validateCustomAlias, isValidUrl } from "@/lib/shortCode"

// GET /api/urls - List all URLs for authenticated user
export async function GET() {
  try {
    const user = await requireAuth()
    
    const urls = await prisma.url.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        customAlias: true,
        createdAt: true,
        clickCount: true,
        isActive: true,
        expiresAt: true,
      },
    })
    
    return NextResponse.json({ urls })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error fetching URLs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/urls - Create a new short URL
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const { originalUrl, customAlias, expiresAt } = body
    
    // Check if user has reached the limit of 5 active URLs
    const activeUrlsCount = await prisma.url.count({
      where: {
        userId: user.id,
        isActive: true,
      },
    })
    
    if (activeUrlsCount >= 5) {
      return NextResponse.json(
        { error: "You can only have 5 active URLs at a time. Please deactivate some URLs first." },
        { status: 403 }
      )
    }
    
    // Validate original URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: "Valid URL is required" },
        { status: 400 }
      )
    }
    
    // Validate custom alias if provided
    if (customAlias) {
      const validation = validateCustomAlias(customAlias)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
      
      // Check if custom alias already exists
      const existing = await prisma.url.findUnique({
        where: { customAlias },
      })
      
      if (existing) {
        return NextResponse.json(
          { error: "This alias is already taken" },
          { status: 409 }
        )
      }
    }
    
    // Generate unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      const existing = await prisma.url.findUnique({
        where: { shortCode },
      })
      
      if (!existing) break
      
      shortCode = generateShortCode()
      attempts++
    }
    
    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique short code" },
        { status: 500 }
      )
    }
    
    // Create URL
    const url = await prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        customAlias: customAlias || null,
        userId: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        customAlias: true,
        createdAt: true,
        clickCount: true,
        isActive: true,
        expiresAt: true,
      },
    })
    
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error creating URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
