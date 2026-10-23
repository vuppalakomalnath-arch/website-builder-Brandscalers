import { prisma } from '@/server/db/client';
import LivePreviewClient from './live-client';

export const dynamic = 'force-dynamic';

interface LivePageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ url?: string; page?: string }>;
}

export default async function LivePage({ params, searchParams }: LivePageProps) {
  const { projectId } = await params;
  const { url, page } = await searchParams;

  let initialProject: any = null;
  let latestVersion: any = null;

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
        },
      });

      if (project) {
        initialProject = {
          id: project.id,
          name: project.name,
        };
        latestVersion = project.versions[0] || null;
      }
    } catch (err) {
      console.warn('Could not fetch project for live preview from DB:', err);
    }
  }

  return (
    <LivePreviewClient
      projectId={projectId}
      initialProject={initialProject}
      initialVersion={latestVersion}
      mockPublishedUrl={url || ''}
      initialPageSlug={page || 'home'}
    />
  );
}
