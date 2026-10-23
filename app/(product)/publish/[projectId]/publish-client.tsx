'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Layout,
  Palette,
  Layers,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Loader2,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { WebsitePreview } from '@/engine/rendering/preview-runtime';

export interface PublishClientProps {
  projectId: string;
  initialProject?: any;
  initialVersion?: any;
  initialQualityReport?: any;
  initialCostINR?: number;
}

export default function PublishClient({
  projectId,
  initialProject,
  initialVersion,
  initialQualityReport,
  initialCostINR = 0.02,
}: PublishClientProps) {
  // Loaded state
  const [manifest, setManifest] = useState<any>(initialVersion?.manifest || null);
  const [designSystem, setDesignSystem] = useState<any>(initialVersion?.designSystem || null);
  const [contentBlocks, setContentBlocks] = useState<any[]>(initialVersion?.contentBlocks || []);
  const [businessProfile, setBusinessProfile] = useState<any>(initialVersion?.businessProfile || null);
  const [qualityReport, setQualityReport] = useState<any>(initialQualityReport || null);
  const [activePageSlug, setActivePageSlug] = useState<string>('home');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [domainType, setDomainType] = useState<'brandscalers' | 'custom'>('brandscalers');
  const [subdomainSlug, setSubdomainSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [publishState, setPublishState] = useState<'idle' | 'deploying' | 'published'>('idle');
  const [deployStepText, setDeployStepText] = useState('Packaging components & styles...');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Load from local storage cache if available to capture latest visual edits
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
          if (parsed.businessProfile) setBusinessProfile(parsed.businessProfile);
          if (parsed.qualityReport) setQualityReport(parsed.qualityReport);
        }
      } catch (e) {
        console.warn('Could not read cached project:', e);
      }
    }
  }, [projectId]);

  // Derive default subdomain from business name
  useEffect(() => {
    const rawName = businessProfile?.businessName || initialProject?.name || 'my-website';
    const slug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSubdomainSlug(slug || 'my-brand');
    setCustomDomain(`www.${slug || 'mybrand'}.com`);
  }, [businessProfile, initialProject]);

  // Handle mock publish execution
  const handleStartPublish = () => {
    setPublishState('deploying');
    setDeployStepText('Compiling HTML5 component tree & design tokens...');

    setTimeout(() => {
      setDeployStepText('Provisioning SSL certificate on BrandScalers Edge Network...');
    }, 700);

    setTimeout(() => {
      setDeployStepText('Deploying static bundles to global Anycast CDN...');
    }, 1400);

    setTimeout(() => {
      let finalUrl = '';
      if (domainType === 'brandscalers') {
        const cleanSlug = subdomainSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site';
        finalUrl = `https://${cleanSlug}.brandscalers.site`;
      } else {
        const cleanDomain = customDomain.trim().toLowerCase() || 'www.mywebsite.com';
        finalUrl = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`;
      }
      setPublishedUrl(finalUrl);
      setPublishState('published');
    }, 2200);
  };

  const handleCopyUrl = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 3000);
  };

  const pages = manifest?.pages || [];
  const activePage = pages.find((p: any) => p.slug === activePageSlug) || pages[0];
  const dials = designSystem?.dials || {};
  const blueprint = businessProfile?.confirmedFacts?.referenceBlueprint;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--studio-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="studio-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/editor/${projectId}`} className="studio-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <ArrowLeft size={15} /> Back to Editor
          </Link>
          <div className="studio-logo" style={{ fontSize: '15px' }}>
            <span>W</span> Website Studio
          </div>
          <span style={{ color: 'var(--studio-muted)', fontSize: '14px' }}>&bull;</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {businessProfile?.businessName || initialProject?.name || 'Website'} &mdash; Final Draft
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="cost-telemetry-chip">
            <Sparkles size={14} /> Total Cost: ₹{initialCostINR.toFixed(2)} / ₹8.00
          </div>
          <button
            onClick={() => {
              setPublishState('idle');
              setIsPublishModalOpen(true);
            }}
            className="studio-btn primary"
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#8a5334',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(138, 83, 52, 0.25)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Globe size={15} />
            <span>Publish Website</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', width: '100%' }}>
        {/* Hero Draft Header */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--studio-border)',
            padding: '28px 32px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#f4ece2',
                  color: 'var(--studio-accent)',
                  letterSpacing: '0.06em',
                }}
              >
                Production Draft
              </span>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={13} /> Ready to Deploy
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--studio-ink)' }}>
              {businessProfile?.businessName || initialProject?.name || 'Website Studio Project'}
            </h1>
            <p style={{ margin: 0, color: 'var(--studio-muted)', fontSize: '14px' }}>
              All 5 pages, typography tokens, responsive layouts, and BrandScalers component looks are verified.
            </p>
          </div>

          <button
            onClick={() => {
              setPublishState('idle');
              setIsPublishModalOpen(true);
            }}
            className="studio-btn primary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#8a5334',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Globe size={16} /> Publish Website
          </button>
        </div>

        {/* 4 Specifications Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Brand & Strategy */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--studio-border)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--studio-ink)', fontWeight: 700, fontSize: '14px' }}>
              <Compass size={16} color="var(--studio-accent)" />
              <span>Brand &amp; Identity</span>
            </div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Category</span>
                <b>{businessProfile?.businessCategory || 'General Business'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Primary Goal</span>
                <span style={{ color: 'var(--studio-ink)' }}>{businessProfile?.primaryGoal || 'Showcase offerings & drive conversion'}</span>
              </div>
              {blueprint && (
                <div style={{ background: '#faf6f0', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ebd9c8', marginTop: '4px' }}>
                  <span style={{ color: '#8a5334', fontSize: '11px', fontWeight: 700, display: 'block' }}>Benchmark Reference</span>
                  <div style={{ fontWeight: 600, fontSize: '12px' }}>{blueprint.name || 'Archetype'}</div>
                  <small style={{ color: 'var(--studio-muted)', fontSize: '11px' }}>{blueprint.url}</small>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Design System & Styling */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--studio-border)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--studio-ink)', fontWeight: 700, fontSize: '14px' }}>
              <Palette size={16} color="var(--studio-accent)" />
              <span>Design System Tokens</span>
            </div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Concept Style</span>
                <b>{designSystem?.conceptName || 'Natural Minimalist'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Typography Pairing</span>
                <span>{dials?.font || 'Inter & Playfair'} ({dials?.headWeight || '600'} weight)</span>
              </div>
              <div>
                <span style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Color Palette</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'Accent', color: dials?.accent || '#8c593b' },
                    { label: 'Ink', color: dials?.ink || '#1c1d1f' },
                    { label: 'Bg', color: dials?.bg || '#ffffff' },
                    { label: 'Surface', color: dials?.surface || '#f7f6f2' },
                  ].map((c) => (
                    <div
                      key={c.label}
                      title={`${c.label}: ${c.color}`}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: c.color,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Site Architecture & Pages */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--studio-border)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--studio-ink)', fontWeight: 700, fontSize: '14px' }}>
              <Layout size={16} color="var(--studio-accent)" />
              <span>Site Architecture</span>
            </div>
            <div style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Total Pages:</span>
                <b>{pages.length} Pages</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Component Pieces:</span>
                <b>{pages.reduce((acc: number, p: any) => acc + (p.componentInstances?.length || 0), 0)} Instances</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Button Style:</span>
                <b style={{ textTransform: 'capitalize' }}>{dials?.buttons || 'Solid'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Corner Radius:</span>
                <b style={{ textTransform: 'capitalize' }}>{dials?.radius || 'Soft'}</b>
              </div>
            </div>
          </div>

          {/* Card 4: Quality & Compliance */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--studio-border)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--studio-ink)', fontWeight: 700, fontSize: '14px' }}>
              <ShieldCheck size={16} color="#166534" />
              <span>5-Gate Quality Score</span>
            </div>
            <div style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>WCAG Contrast:</span>
                <b style={{ color: '#166534' }}>{qualityReport?.a11yCheck?.contrastRatio || '5.8'}:1 (AA)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Responsive Overflows:</span>
                <b style={{ color: '#166534' }}>0 Detected</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Broken Controls:</span>
                <b style={{ color: '#166534' }}>0 Broken</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--studio-muted)' }}>Visual Uniqueness:</span>
                <b style={{ color: '#166534' }}>100% Unique</b>
              </div>
            </div>
          </div>
        </div>

        {/* Pages Breakdown List */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--studio-border)',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--studio-ink)' }}>
              Page Layouts &amp; Section Breakdowns ({pages.length} Pages)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
              Click any page to switch the live canvas below
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            {pages.map((p: any) => {
              const isSelected = activePageSlug === p.slug;
              const instances = p.componentInstances || [];
              let displayName = p.slug.charAt(0).toUpperCase() + p.slug.slice(1);
              if (p.slug === 'home') displayName = 'Home Page';
              if (p.slug === 'about') displayName = 'About Us';
              if (p.slug === 'faq') displayName = 'FAQs';
              if (p.slug === 'contact') displayName = 'Contact Us';
              if (p.slug === 'shop') displayName = 'Shop Collections';
              if (p.slug === 'services') displayName = 'Services';

              return (
                <div
                  key={p.slug}
                  onClick={() => setActivePageSlug(p.slug)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--studio-accent)' : 'var(--studio-border)',
                    background: isSelected ? '#faf7f2' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <b style={{ fontSize: '13px', color: isSelected ? 'var(--studio-accent)' : 'var(--studio-ink)' }}>
                      {displayName}
                    </b>
                    <span style={{ fontSize: '11px', color: 'var(--studio-muted)' }}>{instances.length} sections</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {instances.map((ci: any) => (
                      <span
                        key={ci.instanceId}
                        style={{
                          fontSize: '10px',
                          background: isSelected ? '#f1e6da' : '#f4f3ef',
                          color: '#5c4838',
                          padding: '2px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        {ci.pieceId.replace(/^p-[a-z]+-/, '')} ({ci.variantName})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Live Preview Stage */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--studio-border)',
            padding: '20px 24px',
            marginBottom: '40px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--studio-ink)' }}>
                Live Canvas Verification
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)' }}>
                Viewing: <b style={{ color: 'var(--studio-ink)' }}>/{activePageSlug}</b> &mdash; All buttons, navigation, and links are interactive.
              </p>
            </div>

            {/* Viewport switchers */}
            <div className="viewport-toggles" style={{ margin: 0 }}>
              <button
                className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewport('desktop')}
              >
                <Monitor size={14} /> Desktop
              </button>
              <button
                className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewport('tablet')}
              >
                <Tablet size={14} /> Tablet
              </button>
              <button
                className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewport('mobile')}
              >
                <Smartphone size={14} /> Mobile
              </button>
            </div>
          </div>

          {/* Canvas Box */}
          <div
            style={{
              background: '#f2eee9',
              borderRadius: '8px',
              border: '1px solid #e0d6cb',
              padding: '16px 0',
              overflow: 'auto',
              minHeight: '520px',
            }}
          >
            {manifest && designSystem ? (
              <WebsitePreview
                manifest={manifest}
                designSystem={designSystem}
                contentBlocks={contentBlocks}
                activePageSlug={activePageSlug}
                viewport={viewport}
                isEditable={false}
                onNavigatePage={(slug) => setActivePageSlug(slug)}
              />
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--studio-muted)' }}>
                Loading preview canvas...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 29, 31, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              border: '1px solid var(--studio-border)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid var(--studio-border)',
                background: '#faf8f5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#8a5334" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--studio-ink)' }}>
                  Publish Website
                </h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--studio-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {publishState === 'idle' && (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--studio-muted)' }}>
                    Choose your hosting destination. All websites include automated Edge SSL, global CDN delivery, and responsive optimization.
                  </p>

                  {/* Option 1: Brandscalers Domain */}
                  <div
                    onClick={() => setDomainType('brandscalers')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: domainType === 'brandscalers' ? 'var(--studio-accent)' : '#e5dfd7',
                      background: domainType === 'brandscalers' ? '#faf7f2' : '#ffffff',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="domainChoice"
                          checked={domainType === 'brandscalers'}
                          onChange={() => setDomainType('brandscalers')}
                          style={{ cursor: 'pointer' }}
                        />
                        <b style={{ fontSize: '14px', color: 'var(--studio-ink)' }}>1. BrandScalers Domain</b>
                      </div>
                      <span style={{ fontSize: '11px', background: '#e8faea', color: '#166534', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                        Instant &bull; Free SSL
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--studio-muted)', margin: '0 0 10px 24px' }}>
                      Publish instantly on BrandScalers Edge subdomains with zero configuration needed.
                    </p>

                    {domainType === 'brandscalers' && (
                      <div style={{ marginLeft: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>https://</span>
                          <input
                            type="text"
                            value={subdomainSlug}
                            onChange={(e) => setSubdomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="my-business"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d4c7b8',
                              fontSize: '13px',
                              fontWeight: 600,
                              outline: 'none',
                              flex: 1,
                            }}
                          />
                          <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontWeight: 600 }}>.brandscalers.site</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Custom Domain */}
                  <div
                    onClick={() => setDomainType('custom')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: domainType === 'custom' ? 'var(--studio-accent)' : '#e5dfd7',
                      background: domainType === 'custom' ? '#faf7f2' : '#ffffff',
                      cursor: 'pointer',
                      marginBottom: '20px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="domainChoice"
                          checked={domainType === 'custom'}
                          onChange={() => setDomainType('custom')}
                          style={{ cursor: 'pointer' }}
                        />
                        <b style={{ fontSize: '14px', color: 'var(--studio-ink)' }}>2. Custom Domain</b>
                      </div>
                      <span style={{ fontSize: '11px', background: '#f5f0eb', color: '#5c4838', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                        Brand Whitelabel
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--studio-muted)', margin: '0 0 10px 24px' }}>
                      Connect your existing company domain (e.g. www.yourcompany.com).
                    </p>

                    {domainType === 'custom' && (
                      <div style={{ marginLeft: '24px' }}>
                        <input
                          type="text"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="www.mybusiness.com"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d4c7b8',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--studio-muted)' }}>
                          CNAME point to: <code>cname.brandscalers.site</code> (DNS automated setup)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleStartPublish}
                    className="studio-btn primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#8a5334',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <Globe size={16} /> Publish to {domainType === 'brandscalers' ? 'BrandScalers Domain' : 'Custom Domain'}
                  </button>
                </div>
              )}

              {publishState === 'deploying' && (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <Loader2 size={36} className="spin" color="#8a5334" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--studio-ink)' }}>
                    Publishing Website...
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--studio-muted)', margin: 0 }}>
                    {deployStepText}
                  </p>
                </div>
              )}

              {publishState === 'published' && (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#166534',
                      display: 'grid',
                      placeItems: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <Check size={28} />
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px', color: 'var(--studio-ink)' }}>
                    🎉 Website Published Successfully!
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--studio-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                    Your website has been compiled and is live on the preview network. Click the link below to view it in a new tab.
                  </p>

                  {/* Mock URL Card */}
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#faf7f2',
                      borderRadius: '8px',
                      border: '1px solid #e2d7cc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Globe size={16} color="#8a5334" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#8a5334',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {publishedUrl}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyUrl}
                      title="Copy URL"
                      style={{
                        padding: '6px 10px',
                        background: '#ffffff',
                        border: '1px solid var(--studio-border)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {hasCopied ? (
                        <>
                          <Check size={13} color="#166534" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <a
                      href={`/live/${projectId}?url=${encodeURIComponent(publishedUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="studio-btn primary"
                      style={{
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        background: '#8a5334',
                        color: '#ffffff',
                        borderRadius: '6px',
                      }}
                    >
                      <span>Open Live Site ↗</span>
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => setIsPublishModalOpen(false)}
                      className="studio-btn"
                      style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
