import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, versionNumber, operation, manifest, designSystem, contentBlocks } = body;

    if (!projectId || !manifest) {
      return NextResponse.json({ error: 'Missing projectId or manifest.' }, { status: 400 });
    }

    // Save a new ProjectVersion snapshot
    const currentVersionCount = await prisma.projectVersion.count({ where: { projectId } });
    const nextVersionNumber = (versionNumber || currentVersionCount) + 1;

    const previousVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersion = await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: nextVersionNumber,
        businessProfile: previousVersion?.businessProfile || {},
        sitePlan: previousVersion?.sitePlan || {},
        designSystem: designSystem || previousVersion?.designSystem || {},
        manifest: manifest,
        contentBlocks: contentBlocks || previousVersion?.contentBlocks || [],
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        projectId,
        action: operation?.type || 'direct_editor_save',
        payload: operation?.payload || {},
      },
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      versionNumber: nextVersionNumber,
    });
  } catch (error: any) {
    console.error('Edit persistence error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to persist edit operation.' },
      { status: 500 }
    );
  }
}
