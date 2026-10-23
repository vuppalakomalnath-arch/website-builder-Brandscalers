import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        generationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        qualityReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const latestVersion = project.versions[0] || null;
    const latestRun = project.generationRuns[0] || null;
    const latestQuality = project.qualityReports[0] || null;

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      latestVersion,
      manifest: latestVersion?.manifest || null,
      designSystem: latestVersion?.designSystem || null,
      contentBlocks: latestVersion?.contentBlocks || [],
      qualityReport: latestQuality || null,
      estimatedAiCostINR: latestRun?.estimatedCostINR || 0,
    });
  } catch (error: any) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
