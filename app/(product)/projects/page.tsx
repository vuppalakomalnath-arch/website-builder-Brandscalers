import Link from 'next/link';
import { prisma } from '@/server/db/client';
import { Plus, ArrowRight, Clock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        generationRuns: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  } catch (err) {
    console.warn('Projects fetch error:', err);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--studio-bg)', display: 'flex', flexDirection: 'column' }}>
      <header className="studio-navbar">
        <Link href="/" className="studio-logo">
          <span>W</span> Website Studio
        </Link>
        <Link href="/new" className="studio-btn primary">
          <Plus size={14} /> New Website
        </Link>
      </header>

      <main style={{ maxWidth: '880px', margin: '48px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: 'var(--studio-ink)' }}>
              My Websites
            </h1>
            <p style={{ margin: 0, color: 'var(--studio-muted)', fontSize: '14px' }}>
              Persisted in MongoDB Atlas with version rollback and zero-Gemini editing.
            </p>
          </div>
          <Link href="/new" className="studio-btn primary">
            <Plus size={16} /> New Website
          </Link>
        </div>

        {projects.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--studio-border)',
              padding: '64px 32px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>No websites created yet</h3>
            <p style={{ color: 'var(--studio-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Create your first website with 3 simple inputs and full access to 98 BrandScalers pieces.
            </p>
            <Link href="/new" className="studio-btn primary">
              Generate First Website <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {projects.map((p) => {
              const latestRun = p.generationRuns[0];
              const cost = latestRun?.estimatedCostINR || 0;

              return (
                <div
                  key={p.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid var(--studio-border)',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px' }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--studio-muted)' }}>
                      <span>Versions: {p.versions.length}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                      <span style={{ color: '#166534', fontWeight: 600 }}>
                        AI Cost: ₹{cost.toFixed(2)} (≤ ₹8.00)
                      </span>
                    </div>
                  </div>

                  <Link href={`/editor/${p.id}`} className="studio-btn primary">
                    Open Editor <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
