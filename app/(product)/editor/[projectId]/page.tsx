import { notFound } from 'next/navigation';
import { prisma } from '@/server/db/client';
import VisualEditorClient from './editor-client';

export const dynamic = 'force-dynamic';

export default async function VisualEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!projectId) {
    notFound();
  }

  let project = null;
  try {
    project = await prisma.project.findUnique({
      where: { id: projectId },
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
  } catch (err) {
    console.warn('Error fetching project on server:', err);
  }

  if (!project) {
    notFound();
  }

  const latestVersion = project.versions[0];
  const latestRun = project.generationRuns[0];
  const latestQuality = project.qualityReports[0];

  return (
    <VisualEditorClient
      projectId={projectId}
      initialManifest={latestVersion?.manifest || null}
      initialDesignSystem={latestVersion?.designSystem || null}
      initialContentBlocks={(latestVersion?.contentBlocks as any[]) || []}
      initialQualityReport={latestQuality?.reportData || null}
      initialCostTelemetry={{
        totalCostINR: latestRun?.estimatedCostINR || 0.02,
        withinBudget: (latestRun?.estimatedCostINR || 0) <= 8.0,
      }}
    />
  );
}
