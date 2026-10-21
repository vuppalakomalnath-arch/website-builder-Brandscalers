import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        generationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Projects list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list projects' },
      { status: 500 }
    );
  }
}
