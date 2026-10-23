import { prisma } from '@/server/db/client';
import PublishClient from './publish-client';

export const dynamic = 'force-dynamic';

interface PublishPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function PublishPage({ params }: PublishPageProps) {
  const { projectId } = await params;

  let initialProject: any = null;
  let latestVersion: any = null;
  let qualityReport: any = null;
  let estimatedAiCostINR = 0.02;

  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(projectId);

  if (isValidObjectId) {
    try {
      const project = await prisma.project.findUnique({
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

      if (project) {
        initialProject = {
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
        latestVersion = project.versions[0] || null;
        qualityReport = project.qualityReports[0] || null;
        estimatedAiCostINR = project.generationRuns[0]?.estimatedCostINR || 0.02;
      }
    } catch (err) {
      console.warn('Could not fetch project from database on publish page:', err);
    }
  }

  return (
    <PublishClient
      projectId={projectId}
      initialProject={initialProject}
      initialVersion={latestVersion}
      initialQualityReport={qualityReport}
      initialCostINR={estimatedAiCostINR}
    />
  );
}
