'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { WebsitePreview } from '@/engine/rendering/preview-runtime';

export interface LivePreviewClientProps {
  projectId: string;
  initialProject?: any;
  initialVersion?: any;
  mockPublishedUrl?: string;
  initialPageSlug?: string;
}

export default function LivePreviewClient({
  projectId,
  initialProject,
  initialVersion,
  mockPublishedUrl,
  initialPageSlug = 'home',
}: LivePreviewClientProps) {
  const [manifest, setManifest] = useState<any>(initialVersion?.manifest || null);
  const [designSystem, setDesignSystem] = useState<any>(initialVersion?.designSystem || null);
  const [contentBlocks, setContentBlocks] = useState<any[]>(initialVersion?.contentBlocks || []);
  const [activePageSlug, setActivePageSlug] = useState<string>(initialPageSlug || 'home');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasCopied, setHasCopied] = useState(false);
  const [showPill, setShowPill] = useState(true);

  // Fallback to localStorage if in-memory edits were made
  useEffect(() => {
    if (!projectId) return;
    const cached = localStorage.getItem(`ws_project_${projectId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.manifest && parsed.designSystem) {
          setManifest(parsed.manifest);
          setDesignSystem(parsed.designSystem);
          if (parsed.contentBlocks) setContentBlocks(parsed.contentBlocks);
        }
      } catch (e) {
        console.warn('Could not read cached project for live preview:', e);
      }
    }
  }, [projectId]);

  const displayUrl =
    mockPublishedUrl ||
    (initialProject?.name
      ? `https://${initialProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.brandscalers.site`
      : 'https://preview.brandscalers.site');

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  if (!manifest || !designSystem) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f7f6f2', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '12px' }}>
            <Globe size={16} color="#8a5334" /> Connecting to BrandScalers Live Edge...
          </div>
          <p style={{ color: '#666', fontSize: '13px' }}>Rendering production bundle...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--studio-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Real Standalone Web Stage */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <WebsitePreview
          manifest={manifest}
          designSystem={designSystem}
          contentBlocks={contentBlocks}
          activePageSlug={activePageSlug}
          viewport={viewport}
          isEditable={false}
          onNavigatePage={(slug) => {
            setActivePageSlug(slug);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </main>

      {/* Floating Live Preview Status Pill */}
      {showPill && (
        <aside
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '24px',
            background: 'rgba(28, 29, 31, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            borderRadius: '30px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span style={{ fontWeight: 600 }}>Live Preview</span>
            <span style={{ opacity: 0.5 }}>&bull;</span>
            <span style={{ opacity: 0.85, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayUrl.replace('https://', '')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '10px' }}>
            {/* Viewport Toggles */}
            <button
              onClick={() => setViewport('desktop')}
              title="Desktop View"
              style={{
                background: viewport === 'desktop' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              title="Tablet View"
              style={{
                background: viewport === 'tablet' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <Tablet size={13} />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              title="Mobile View"
              style={{
                background: viewport === 'mobile' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <Smartphone size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '10px' }}>
            <button
              onClick={handleCopy}
              title="Copy mock URL"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {hasCopied ? (
                <>
                  <Check size={12} color="#22c55e" /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>

            <Link
              href={`/editor/${projectId}`}
              style={{
                color: '#e2d9cf',
                textDecoration: 'none',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <ArrowLeft size={11} /> Editor
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
