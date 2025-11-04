import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params
    
    // Find URL by shortCode or customAlias
    const url = await prisma.url.findFirst({
      where: {
        OR: [
          { shortCode },
          { customAlias: shortCode },
        ],
        isActive: true,
      },
    })
    
    if (!url) {
      return NextResponse.redirect(new URL('/?error=not-found', request.url))
    }
    
    // Check if expired
    if (url.expiresAt && url.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/?error=expired', request.url))
    }
    
    // Get analytics data
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : realIp || undefined
    
    // Record click analytics and increment counter in parallel
    await Promise.all([
      prisma.clickAnalytics.create({
        data: {
          urlId: url.id,
          ipAddress,
          userAgent,
          referer,
        },
      }),
      prisma.url.update({
        where: { id: url.id },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),
    ])
    
    // Redirect to original URL
    return NextResponse.redirect(url.originalUrl)
  } catch (error) {
    console.error("Error in redirect:", error)
    return NextResponse.redirect(new URL('/?error=server-error', request.url))
  }
}
