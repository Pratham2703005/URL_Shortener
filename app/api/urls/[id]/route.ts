import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/serverAuth"

// DELETE /api/urls/[id] - Delete a URL
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    // Check if URL exists and belongs to user
    const url = await prisma.url.findUnique({
      where: { id },
    })
    
    if (!url) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }
    
    if (url.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Delete URL and associated analytics
    await prisma.url.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error deleting URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/urls/[id] - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    // Check if URL exists and belongs to user
    const url = await prisma.url.findUnique({
      where: { id },
    })
    
    if (!url) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }
    
    if (url.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Update URL
    const updatedUrl = await prisma.url.update({
      where: { id },
      data: {
        isActive: body.isActive ?? url.isActive,
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
    
    return NextResponse.json({ url: updatedUrl })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error updating URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
