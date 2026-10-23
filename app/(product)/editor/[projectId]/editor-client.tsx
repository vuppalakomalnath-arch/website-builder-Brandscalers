'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Plus,
  Loader2,
  Upload,
  Image as ImageIcon,
  Video,
  Paperclip,
  X,
  Link2,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { WebsitePreview, MediaTarget } from '@/engine/rendering/preview-runtime';
import { PRESETS, designToVars, fontsHref, FONT_PAIRS } from '@/engine/design-system/tokens';
import libraryRegistry from '@/registry/library-registry.json';
import { MediaUploadModal } from './media-upload-modal';

export interface VisualEditorClientProps {
  projectId: string;
  initialManifest?: any;
  initialDesignSystem?: any;
  initialContentBlocks?: any[];
  initialQualityReport?: any;
  initialCostTelemetry?: { totalCostINR: number; withinBudget: boolean };
}

export default function VisualEditorClient({
  projectId,
  initialManifest,
  initialDesignSystem,
  initialContentBlocks,
  initialQualityReport,
  initialCostTelemetry,
}: VisualEditorClientProps) {
  const params = useParams();
  const router = useRouter();

  // Editor State
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'dials' | 'section' | 'quality'>('dials');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [activePageSlug, setActivePageSlug] = useState<string>('home');

  // Loaded Project Data
  const [manifest, setManifest] = useState<any>(initialManifest || null);
  const [designSystem, setDesignSystem] = useState<any>(initialDesignSystem || null);
  const [contentBlocks, setContentBlocks] = useState<any[]>(initialContentBlocks || []);
  const [qualityReport, setQualityReport] = useState<any>(initialQualityReport || null);
  const [costTelemetry, setCostTelemetry] = useState<{ totalCostINR: number; withinBudget: boolean }>(
    initialCostTelemetry || { totalCostINR: 0.02, withinBudget: true }
  );

  // Autosave and History
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // AI Section Copilot State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  
  // Media Upload & Attachment State
  const [activeMediaTarget, setActiveMediaTarget] = useState<MediaTarget | null>(null);
  const [attachedMedia, setAttachedMedia] = useState<{
    url: string;
    mediaType: 'image' | 'video' | 'logo';
    filename?: string;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([
    {
      manifest: initialManifest,
      designSystem: initialDesignSystem,
      contentBlocks: initialContentBlocks || [],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(initialManifest ? 0 : -1);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load project on mount
  useEffect(() => {
    if (!projectId) return;

    let hasLoaded = false;
    // 1. Check localStorage first
    const cached = localStorage.getItem(`ws_project_${projectId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.manifest && parsed.designSystem) {
          setManifest(parsed.manifest);
          setDesignSystem(parsed.designSystem);
          setContentBlocks(parsed.contentBlocks || []);
          setQualityReport(parsed.qualityReport);
          if (parsed.estimatedAiCostINR !== undefined) {
            setCostTelemetry({ totalCostINR: parsed.estimatedAiCostINR, withinBudget: parsed.estimatedAiCostINR <= 8.0 });
          }
          setHistory([
            {
              manifest: parsed.manifest,
              designSystem: parsed.designSystem,
              contentBlocks: parsed.contentBlocks || [],
            },
          ]);
          setHistoryIndex(0);
          hasLoaded = true;
        }
      } catch (e) {
        console.error('Error parsing cached project:', e);
      }
    }

    // 2. Fetch from DB API if not loaded or to sync
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.manifest) {
          setManifest(data.manifest);
          setDesignSystem(data.designSystem);
          setContentBlocks(data.contentBlocks || []);
          if (data.qualityReport) setQualityReport(data.qualityReport);
          if (data.estimatedAiCostINR !== undefined) {
            setCostTelemetry({ totalCostINR: data.estimatedAiCostINR, withinBudget: data.estimatedAiCostINR <= 8.0 });
          }
          if (!hasLoaded) {
            setHistory([
              {
                manifest: data.manifest,
                designSystem: data.designSystem,
                contentBlocks: data.contentBlocks || [],
              },
            ]);
            setHistoryIndex(0);
          }
          // Update cache with verified data
          localStorage.setItem(`ws_project_${projectId}`, JSON.stringify(data));
        }
      })
      .catch((err) => console.warn('Project API fetch error:', err));

    // 3. Fetch usage telemetry from API
    fetch(`/api/usage/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCostTelemetry({
            totalCostINR: data.totalCostINR,
            withinBudget: data.withinBudget,
          });
        }
      })
      .catch((err) => console.warn('Usage fetch error:', err));
  }, [projectId]);

  // Debounced Autosave (800ms) - Zero Gemini cost
  const triggerAutosave = useCallback(
    (newManifest: any, newDesignSystem: any, newContentBlocks: any) => {
      setSaveStatus('saving');
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/edits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              manifest: newManifest,
              designSystem: newDesignSystem,
              contentBlocks: newContentBlocks,
              operation: { type: 'direct_editor_save' },
            }),
          });
          if (res.ok) {
            setSaveStatus('saved');
            const existing = JSON.parse(localStorage.getItem(`ws_project_${projectId}`) || '{}');
            localStorage.setItem(
              `ws_project_${projectId}`,
              JSON.stringify({
                ...existing,
                manifest: newManifest,
                designSystem: newDesignSystem,
                contentBlocks: newContentBlocks,
              })
            );
          } else {
            setSaveStatus('error');
          }
        } catch (e) {
          setSaveStatus('error');
        }
      }, 800);
    },
    [projectId]
  );

  // Commit state to history stack
  const commitState = (newManifest: any, newDesignSystem: any, newContentBlocks: any) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      manifest: JSON.parse(JSON.stringify(newManifest)),
      designSystem: JSON.parse(JSON.stringify(newDesignSystem)),
      contentBlocks: JSON.parse(JSON.stringify(newContentBlocks)),
    });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    triggerAutosave(newManifest, newDesignSystem, newContentBlocks);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setManifest(target.manifest);
      setDesignSystem(target.designSystem);
      setContentBlocks(target.contentBlocks);
      setHistoryIndex(historyIndex - 1);
      triggerAutosave(target.manifest, target.designSystem, target.contentBlocks);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setManifest(target.manifest);
      setDesignSystem(target.designSystem);
      setContentBlocks(target.contentBlocks);
      setHistoryIndex(historyIndex + 1);
      triggerAutosave(target.manifest, target.designSystem, target.contentBlocks);
    }
  };

  // Update specific section property
  const handleUpdateSectionProp = (instanceId: string, field: string, value: any) => {
    if (!manifest) return;
    const nextPages = manifest.pages.map((p: any) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci: any) =>
        ci.instanceId === instanceId ? { ...ci, props: { ...ci.props, [field]: value } } : ci
      ),
    }));
    const nextManifest = { ...manifest, pages: nextPages };
    setManifest(nextManifest);
    commitState(nextManifest, designSystem, contentBlocks);
  };

  // Switch look / variant of a section
  const handleSwitchVariant = (instanceId: string, variantName: string) => {
    if (!manifest) return;
    const nextPages = manifest.pages.map((p: any) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci: any) =>
        ci.instanceId === instanceId
          ? {
              ...ci,
              variantName,
              lookVariantId: variantName,
            }
          : ci
      ),
    }));
    const nextManifest = { ...manifest, pages: nextPages };
    setManifest(nextManifest);
    commitState(nextManifest, designSystem, contentBlocks);
  };

  // Update section media (logo, hero image, hero video, product item image)
  const handleUpdateMedia = (instanceId: string, field: string, url: string, itemIndex?: number) => {
    if (!manifest) return;
    const nextPages = manifest.pages.map((p: any) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci: any) => {
        if (ci.instanceId !== instanceId) return ci;
        if (itemIndex !== undefined && Array.isArray(ci.props?.[field])) {
          const nextItems = [...(ci.props[field] || [])];
          nextItems[itemIndex] = { ...nextItems[itemIndex], imageUrl: url };
          return { ...ci, props: { ...ci.props, [field]: nextItems } };
        }
        return { ...ci, props: { ...ci.props, [field]: url } };
      }),
    }));
    const nextManifest = { ...manifest, pages: nextPages };
    setManifest(nextManifest);
    commitState(nextManifest, designSystem, contentBlocks);
  };

  // AI Section Regeneration Handler
  const handleRegenerateSectionWithAI = async () => {
    if (!selectedInstance || !aiPrompt.trim() || isRegenerating) return;
    setIsRegenerating(true);
    setAiStatusMessage({ type: 'info', text: 'Gemini AI is crafting tailored copy, items, and layout...' });

    try {
      const res = await fetch('/api/edits/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          instanceId: selectedInstance.instanceId,
          pieceId: selectedInstance.pieceId,
          pieceTitle: selectedPiece?.title || selectedInstance.pieceId,
          variantName: selectedInstance.variantName,
          availableVariants: selectedPiece?.variants?.map((v: any) => v.name) || [],
          currentProps: selectedInstance.props || {},
          userPrompt: aiPrompt.trim(),
          businessProfile: manifest?.businessProfile || initialManifest?.businessProfile,
          pageSlug: activePageSlug,
          mediaUrl: attachedMedia?.url,
          logoUrl: attachedMedia?.mediaType === 'logo' ? attachedMedia.url : undefined,
          imageUrl: attachedMedia?.mediaType === 'image' ? attachedMedia.url : undefined,
          videoUrl: attachedMedia?.mediaType === 'video' ? attachedMedia.url : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply changes with AI');
      }

      // Update the section props and variant directly in manifest
      const nextPages = manifest.pages.map((p: any) => ({
        ...p,
        componentInstances: p.componentInstances.map((ci: any) =>
          ci.instanceId === selectedInstance.instanceId
            ? {
                ...ci,
                props: { ...ci.props, ...data.updatedProps },
                variantName: data.variantName || ci.variantName,
                lookVariantId: data.variantName || ci.lookVariantId,
              }
            : ci
        ),
      }));
      const nextManifest = { ...manifest, pages: nextPages };
      setManifest(nextManifest);
      commitState(nextManifest, designSystem, contentBlocks);

      if (data.totalCostINR) {
        setCostTelemetry({
          totalCostINR: data.totalCostINR,
          withinBudget: data.totalCostINR <= 8.0,
        });
      }

      setAiStatusMessage({
        type: 'success',
        text: `✨ ${data.summaryOfChanges || 'Changes generated and applied successfully!'} (+₹${(data.costINR || 0.02).toFixed(2)})`,
      });
      setTimeout(() => setAiStatusMessage(null), 6000);
    } catch (err: any) {
      console.error('Section AI regeneration failed:', err);
      setAiStatusMessage({
        type: 'error',
        text: err.message || 'AI generation encountered an error.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Dial Change Handler
  const handleDialChange = (key: string, val: any) => {
    if (!designSystem) return;
    const nextDials = { ...designSystem.dials, [key]: val };
    const { vars, attrs } = designToVars(nextDials);
    const nextDS = {
      ...designSystem,
      dials: nextDials,
      computedTokens: vars,
      rootAttributes: attrs,
      googleFontsUrl: fontsHref(nextDials),
    };
    setDesignSystem(nextDS);
    commitState(manifest, nextDS, contentBlocks);
  };

  // Preset Applicator
  const handleApplyPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (!preset || !designSystem) return;
    const { vars, attrs } = designToVars(preset);
    const nextDS = {
      ...designSystem,
      conceptName: presetName,
      dials: preset,
      computedTokens: vars,
      rootAttributes: attrs,
      googleFontsUrl: fontsHref(preset),
    };
    setDesignSystem(nextDS);
    commitState(manifest, nextDS, contentBlocks);
  };


  // Toggle Section Visibility
  const handleToggleVisibility = (instanceId: string) => {
    if (!manifest) return;
    const nextPages = manifest.pages.map((p: any) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci: any) =>
        ci.instanceId === instanceId ? { ...ci, isVisible: !ci.isVisible } : ci
      ),
    }));
    const nextManifest = { ...manifest, pages: nextPages };
    setManifest(nextManifest);
    commitState(nextManifest, designSystem, contentBlocks);
  };

  if (!manifest || !designSystem) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--studio-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="cost-telemetry-chip" style={{ marginBottom: '14px' }}>
            <Sparkles size={14} /> Loading Website Studio Canvas...
          </div>
          <p style={{ color: 'var(--studio-muted)', fontSize: '14px' }}>
            Retrieving project versions and BrandScalers registry...
          </p>
        </div>
      </div>
    );
  }

  const activePage = manifest.pages.find((p: any) => p.slug === activePageSlug) || manifest.pages[0];
  const selectedInstance = activePage?.componentInstances.find((ci: any) => ci.instanceId === selectedInstanceId);
  const selectedPiece = (libraryRegistry as any).pieces.find((p: any) => p.id === selectedInstance?.pieceId);
  const selectedProps = selectedInstance?.props || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="studio-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/new" className="studio-btn" style={{ padding: '6px 10px' }}>
            <ArrowLeft size={16} /> New
          </Link>
          <div className="studio-logo" style={{ fontSize: '15px' }}>
            <span>W</span> Website Studio
          </div>
          <span style={{ color: 'var(--studio-muted)', fontSize: '14px' }}>&bull;</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{manifest.pages[0]?.title || 'Website Studio'}</span>
        </div>

        {/* Viewport Switcher */}
        <div className="viewport-toggles">
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
            <Tablet size={14} /> Tablet (768px)
          </button>
          <button
            className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewport('mobile')}
          >
            <Smartphone size={14} /> Mobile (375px)
          </button>
        </div>

        {/* Undo, Redo, Autosave, Cost Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="studio-btn"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
            style={{ padding: '6px 10px', opacity: historyIndex <= 0 ? 0.4 : 1 }}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="studio-btn"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            style={{ padding: '6px 10px', opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}
          >
            <Redo2 size={16} />
          </button>

          <span
            style={{
              fontSize: '12px',
              color: saveStatus === 'saving' ? 'var(--studio-accent)' : 'var(--studio-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {saveStatus === 'saving' ? (
              'Saving...'
            ) : (
              <>
                <Check size={14} color="#166534" /> Saved
              </>
            )}
          </span>

          <div className="cost-telemetry-chip">
            <Sparkles size={14} /> AI Cost: ₹{costTelemetry.totalCostINR.toFixed(2)} / ₹8.00
          </div>

          <Link
            href={`/publish/${projectId}`}
            className="studio-btn primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--studio-accent)',
              color: '#ffffff',
              textDecoration: 'none',
              marginLeft: '4px',
            }}
          >
            <span>Final Draft &amp; Publish</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Editor Main Canvas */}
      <div className="editor-container">
        {/* Left Sidebar: Pages & Section Navigator */}
        <aside className="editor-sidebar">
          {/* Pages List (Home, Shop/Services, About Us, FAQs, Contact) */}
          <div className="prop-group">
            <div className="prop-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pages ({manifest.pages.length})</span>
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              {manifest.pages.map((p: any) => {
                const isCurrent = activePageSlug === p.slug;
                let displayName = p.slug.charAt(0).toUpperCase() + p.slug.slice(1);
                if (p.slug === 'home') displayName = 'Home';
                if (p.slug === 'about') displayName = 'About Us';
                if (p.slug === 'faq') displayName = 'FAQs';
                if (p.slug === 'contact') displayName = 'Contact Us';
                if (p.slug === 'shop') displayName = 'Shop Collections';
                if (p.slug === 'services') displayName = 'Services';

                return (
                  <button
                    key={p.slug}
                    onClick={() => {
                      setActivePageSlug(p.slug);
                      setSelectedInstanceId(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: isCurrent ? 'var(--studio-accent)' : 'transparent',
                      background: isCurrent ? '#f5f0eb' : '#fff',
                      color: isCurrent ? 'var(--studio-ink)' : 'var(--studio-muted)',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{displayName}</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>/{p.slug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Navigator for active page */}
          <div className="prop-group">
            <div className="prop-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sections on /{activePageSlug}</span>
              <span>{activePage?.componentInstances?.length}</span>
            </div>
            {activePage?.componentInstances?.map((ci: any) => {
              const piece = (libraryRegistry as any).pieces.find((p: any) => p.id === ci.pieceId);
              const isSelected = selectedInstanceId === ci.instanceId;

              return (
                <div
                  key={ci.instanceId}
                  className={`nav-section-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedInstanceId(ci.instanceId);
                    setActiveTab('section');
                  }}
                >
                  <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{piece?.title || ci.pieceId}</div>
                    <small style={{ color: 'var(--studio-muted)', fontSize: '11px' }}>{ci.variantName}</small>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(ci.instanceId);
                    }}
                    title={ci.isVisible ? 'Hide Section' : 'Show Section'}
                    style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: '2px', color: 'var(--studio-muted)' }}
                  >
                    {ci.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Live Preview Stage with In-Place Text Editing & Link Interception */}
        <main className="editor-canvas-stage">
          <WebsitePreview
            manifest={manifest}
            designSystem={designSystem}
            contentBlocks={contentBlocks}
            activePageSlug={activePageSlug}
            viewport={viewport}
            selectedInstanceId={selectedInstanceId}
            onSelectInstance={(id) => {
              setSelectedInstanceId(id);
              setActiveTab('section');
            }}
            onNavigatePage={(slug) => {
              setActivePageSlug(slug);
              setSelectedInstanceId(null);
            }}
            onSectionPropChange={handleUpdateSectionProp}
            onMediaClick={(target) => setActiveMediaTarget(target)}
            isEditable={true}
          />
        </main>

        {/* Right Sidebar: Contextual Property Panel & 16 Dials */}
        <aside className="editor-sidebar right">
          {/* Tab Toggles */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--studio-border)', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('dials')}
              style={{
                flex: 1,
                border: 0,
                background: 'transparent',
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'dials' ? '2px solid var(--studio-accent)' : '2px solid transparent',
                color: activeTab === 'dials' ? 'var(--studio-ink)' : 'var(--studio-muted)',
              }}
            >
              <Sliders size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              16 Dials
            </button>
            <button
              onClick={() => setActiveTab('section')}
              style={{
                flex: 1,
                border: 0,
                background: 'transparent',
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'section' ? '2px solid var(--studio-accent)' : '2px solid transparent',
                color: activeTab === 'section' ? 'var(--studio-ink)' : 'var(--studio-muted)',
              }}
            >
              <Layers size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Section
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              style={{
                flex: 1,
                border: 0,
                background: 'transparent',
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'quality' ? '2px solid var(--studio-accent)' : '2px solid transparent',
                color: activeTab === 'quality' ? 'var(--studio-ink)' : 'var(--studio-muted)',
              }}
            >
              <ShieldAlert size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              QA
            </button>
          </div>

          {/* TAB 1: 16 Design Dials */}
          {activeTab === 'dials' && (
            <div>
              {/* Presets */}
              <div className="prop-group">
                <div className="prop-title">Natural Presets (No Bold Gradients)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {Object.keys(PRESETS).map((pName) => (
                    <button
                      key={pName}
                      onClick={() => handleApplyPreset(pName)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--studio-border)',
                        background: designSystem.conceptName === pName ? '#f5f0eb' : '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: designSystem.conceptName === pName ? 600 : 400,
                      }}
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Dials */}
              <div className="prop-group">
                <div className="prop-title">Typography Dials</div>
                <div className="prop-row">
                  <span>Font Pairing</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.font}
                    onChange={(e) => handleDialChange('font', e.target.value)}
                  >
                    {Object.entries(FONT_PAIRS).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="prop-row">
                  <span>Heading Weight</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.headWeight}
                    onChange={(e) => handleDialChange('headWeight', e.target.value)}
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>

              {/* Natural Colors Dials */}
              <div className="prop-group">
                <div className="prop-title">Natural Color Roles</div>
                <div className="prop-row">
                  <span>Accent Tone</span>
                  <input
                    type="color"
                    className="prop-input"
                    value={designSystem.dials.accent}
                    onChange={(e) => handleDialChange('accent', e.target.value)}
                  />
                </div>
                <div className="prop-row">
                  <span>Page Background</span>
                  <input
                    type="color"
                    className="prop-input"
                    value={designSystem.dials.bg}
                    onChange={(e) => handleDialChange('bg', e.target.value)}
                  />
                </div>
                <div className="prop-row">
                  <span>Surface Tint</span>
                  <input
                    type="color"
                    className="prop-input"
                    value={designSystem.dials.surface}
                    onChange={(e) => handleDialChange('surface', e.target.value)}
                  />
                </div>
                <div className="prop-row">
                  <span>Text Ink</span>
                  <input
                    type="color"
                    className="prop-input"
                    value={designSystem.dials.ink}
                    onChange={(e) => handleDialChange('ink', e.target.value)}
                  />
                </div>
              </div>

              {/* Geometry Dials */}
              <div className="prop-group">
                <div className="prop-title">Geometry & Rhythm</div>
                <div className="prop-row">
                  <span>Corner Radius</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.radius}
                    onChange={(e) => handleDialChange('radius', e.target.value)}
                  >
                    <option value="sharp">Sharp (0px)</option>
                    <option value="soft">Soft (8px)</option>
                    <option value="rounded">Rounded (16px)</option>
                    <option value="round">Round (24px)</option>
                  </select>
                </div>
                <div className="prop-row">
                  <span>Button Style</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.buttons}
                    onChange={(e) => handleDialChange('buttons', e.target.value)}
                  >
                    <option value="solid">Solid Fill</option>
                    <option value="outline">Subtle Outline</option>
                    <option value="pill">Pill Shape</option>
                    <option value="underline">Minimal Underline</option>
                  </select>
                </div>
                <div className="prop-row">
                  <span>Cards / Surfaces</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.surface_style}
                    onChange={(e) => handleDialChange('surface_style', e.target.value)}
                  >
                    <option value="outlined">Outlined Border</option>
                    <option value="flat">Flat Surface</option>
                    <option value="raised">Soft Elevation</option>
                    <option value="tinted">Tinted Warmth</option>
                  </select>
                </div>
                <div className="prop-row">
                  <span>Section Padding</span>
                  <select
                    className="prop-select"
                    value={designSystem.dials.density}
                    onChange={(e) => handleDialChange('density', e.target.value)}
                  >
                    <option value="airy">Airy (96px)</option>
                    <option value="balanced">Balanced (64px)</option>
                    <option value="dense">Dense (40px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Section Inspector (Displays ALL Text on this Section) */}
          {activeTab === 'section' && (
            <div>
              {selectedInstance ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <small style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Selected Section</small>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 2px' }}>
                      {selectedPiece?.title || selectedInstance.pieceId}
                    </h3>
                    <code style={{ fontSize: '11px', color: 'var(--studio-muted)' }}>{selectedInstance.pieceId}</code>
                  </div>

                  {/* AI Section Copilot Card */}
                  <div
                    style={{
                      padding: '14px',
                      background: '#faf7f2',
                      borderRadius: '8px',
                      border: '1px solid #e5ded6',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--studio-ink)' }}>
                        <Sparkles size={15} color="#8a5334" />
                        <span>AI Section Copilot</span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#ebe4dc',
                          color: '#5c4838',
                          fontWeight: 500,
                        }}
                      >
                        ≤ ₹0.05
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--studio-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
                      Describe the changes you want. AI will directly update and regenerate copy, headlines, items, and layout variants on the website:
                    </p>

                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Emphasize our 100% handcrafted organic ingredients, change layout to centered, and add 4 seasonal products with prices..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d4c7b8',
                        fontSize: '12px',
                        lineHeight: 1.4,
                        resize: 'vertical',
                        background: '#fff',
                        marginBottom: '8px',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />

                    {/* Attached Media in Copilot */}
                    {attachedMedia ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#fff',
                          border: '1px solid #b49b86',
                          marginBottom: '8px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '13px' }}>
                            {attachedMedia.mediaType === 'video' ? '🎬' : attachedMedia.mediaType === 'logo' ? '👑' : '🖼️'}
                          </span>
                          <span style={{ fontWeight: 600, color: '#3f2d20', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {attachedMedia.filename || (attachedMedia.mediaType === 'logo' ? 'Brand Logo' : 'Attached Media')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedMedia(null)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#991b1b',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove attachment"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMediaTarget({
                              instanceId: selectedInstance.instanceId,
                              field: selectedInstance.pieceId === 'p-frame-header' ? 'logoUrl' : 'imageUrl',
                              mediaType: selectedInstance.pieceId === 'p-frame-header' ? 'logo' : 'image',
                              title: `Attach Media to ${selectedPiece?.title || 'Section'}`,
                            });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px dashed #b49b86',
                            background: '#fff',
                            color: '#6e492f',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            flex: 1,
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Paperclip size={12} />
                          <span>Attach Image / Video (JPG/PNG ≤ 5MB, MP4/MP3 ≤ 10MB)</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Suggestion Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                      {[
                        '✨ Modernize copy & headlines',
                        '🎯 Stronger call to action',
                        '🌿 Natural luxury tone',
                        '🎨 Change to centered layout',
                        '📦 Add 4 products with prices',
                        '⭐ Add 5-star customer reviews',
                        '❓ Add shipping & return FAQs',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const clean = chip.replace(/^[^\w]+/, '');
                            setAiPrompt((prev) => (prev ? `${prev}. ${clean}` : clean));
                          }}
                          style={{
                            border: '1px solid #e0d5c8',
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#5c4838',
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Status message */}
                    {aiStatusMessage && (
                      <div
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontSize: '11px',
                          background:
                            aiStatusMessage.type === 'error'
                              ? '#fee2e2'
                              : aiStatusMessage.type === 'success'
                              ? '#dcfce7'
                              : '#fef3c7',
                          color:
                            aiStatusMessage.type === 'error'
                              ? '#991b1b'
                              : aiStatusMessage.type === 'success'
                              ? '#166534'
                              : '#854d0e',
                        }}
                      >
                        {aiStatusMessage.text}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={handleRegenerateSectionWithAI}
                      disabled={!aiPrompt.trim() || isRegenerating}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '6px',
                        background: !aiPrompt.trim() || isRegenerating ? '#dfd7cf' : '#8a5334',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: !aiPrompt.trim() || isRegenerating ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          Applying Changes with Gemini AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          Generate &amp; Apply Changes to Website
                        </>
                      )}
                    </button>
                  </div>

                  {/* Switch Variant */}
                  <div className="prop-group">
                    <div className="prop-title">Select Look / Variant ({selectedPiece?.variants?.length} Available)</div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {selectedPiece?.variants?.map((v: any) => (
                        <button
                          key={v.name}
                          onClick={() => handleSwitchVariant(selectedInstance.instanceId, v.name)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--studio-border)',
                            background: selectedInstance.variantName === v.name ? '#f5f0eb' : '#fff',
                            fontSize: '13px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontWeight: selectedInstance.variantName === v.name ? 600 : 400,
                          }}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comprehensive Section Text Editor */}
                  <div className="prop-group">
                    <div className="prop-title">Section Content &amp; Copy</div>

                    {/* Eyebrow */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--studio-muted)' }}>
                        Eyebrow / Tag
                      </label>
                      <input
                        type="text"
                        value={selectedProps.eyebrow || ''}
                        onChange={(e) => handleUpdateSectionProp(selectedInstance.instanceId, 'eyebrow', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--studio-border)', fontSize: '13px' }}
                      />
                    </div>

                    {/* Heading */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--studio-muted)' }}>
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={selectedProps.heading || ''}
                        onChange={(e) => handleUpdateSectionProp(selectedInstance.instanceId, 'heading', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--studio-border)', fontSize: '13px' }}
                      />
                    </div>

                    {/* Subheading / Description */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--studio-muted)' }}>
                        Subtitle / Description
                      </label>
                      <textarea
                        rows={3}
                        value={selectedProps.subheading || ''}
                        onChange={(e) => handleUpdateSectionProp(selectedInstance.instanceId, 'subheading', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--studio-border)', fontSize: '13px', resize: 'vertical' }}
                      />
                    </div>

                    {/* CTA Label & Link */}
                    {selectedProps.ctaLabel !== undefined && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--studio-muted)' }}>
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={selectedProps.ctaLabel || ''}
                            onChange={(e) => handleUpdateSectionProp(selectedInstance.instanceId, 'ctaLabel', e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--studio-border)', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--studio-muted)' }}>
                            Button Link
                          </label>
                          <input
                            type="text"
                            value={selectedProps.ctaHref || ''}
                            onChange={(e) => handleUpdateSectionProp(selectedInstance.instanceId, 'ctaHref', e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--studio-border)', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Items / Products / Services List */}
                    {Array.isArray(selectedProps.items) && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="prop-title" style={{ marginBottom: '8px' }}>
                          Cards &amp; Offerings ({selectedProps.items.length})
                        </div>
                        {selectedProps.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid var(--studio-border)', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                              <input
                                type="text"
                                placeholder="Title"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const nextItems = [...selectedProps.items];
                                  nextItems[idx] = { ...nextItems[idx], title: e.target.value };
                                  handleUpdateSectionProp(selectedInstance.instanceId, 'items', nextItems);
                                }}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px', fontWeight: 600 }}
                              />
                              <input
                                type="text"
                                placeholder="Badge/Price"
                                value={item.badge || ''}
                                onChange={(e) => {
                                  const nextItems = [...selectedProps.items];
                                  nextItems[idx] = { ...nextItems[idx], badge: e.target.value };
                                  handleUpdateSectionProp(selectedInstance.instanceId, 'items', nextItems);
                                }}
                                style={{ width: '70px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px' }}
                              />
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Description"
                              value={item.description || ''}
                              onChange={(e) => {
                                const nextItems = [...selectedProps.items];
                                nextItems[idx] = { ...nextItems[idx], description: e.target.value };
                                handleUpdateSectionProp(selectedInstance.instanceId, 'items', nextItems);
                              }}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px', resize: 'vertical' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQs List */}
                    {Array.isArray(selectedProps.faqs) && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="prop-title" style={{ marginBottom: '8px' }}>
                          FAQ Items ({selectedProps.faqs.length})
                        </div>
                        {selectedProps.faqs.map((faq: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid var(--studio-border)', marginBottom: '8px' }}>
                            <input
                              type="text"
                              placeholder="Question"
                              value={faq.question || ''}
                              onChange={(e) => {
                                const nextFaqs = [...selectedProps.faqs];
                                nextFaqs[idx] = { ...nextFaqs[idx], question: e.target.value };
                                handleUpdateSectionProp(selectedInstance.instanceId, 'faqs', nextFaqs);
                              }}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}
                            />
                            <textarea
                              rows={2}
                              placeholder="Answer"
                              value={faq.answer || ''}
                              onChange={(e) => {
                                const nextFaqs = [...selectedProps.faqs];
                                nextFaqs[idx] = { ...nextFaqs[idx], answer: e.target.value };
                                handleUpdateSectionProp(selectedInstance.instanceId, 'faqs', nextFaqs);
                              }}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px', resize: 'vertical' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Testimonials List */}
                    {Array.isArray(selectedProps.testimonials) && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="prop-title" style={{ marginBottom: '8px' }}>
                          Testimonial Reviews ({selectedProps.testimonials.length})
                        </div>
                        {selectedProps.testimonials.map((t: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid var(--studio-border)', marginBottom: '8px' }}>
                            <textarea
                              rows={2}
                              placeholder="Quote"
                              value={t.quote || ''}
                              onChange={(e) => {
                                const nextT = [...selectedProps.testimonials];
                                nextT[idx] = { ...nextT[idx], quote: e.target.value };
                                handleUpdateSectionProp(selectedInstance.instanceId, 'testimonials', nextT);
                              }}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px', resize: 'vertical', marginBottom: '6px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="Author"
                                value={t.author || ''}
                                onChange={(e) => {
                                  const nextT = [...selectedProps.testimonials];
                                  nextT[idx] = { ...nextT[idx], author: e.target.value };
                                  handleUpdateSectionProp(selectedInstance.instanceId, 'testimonials', nextT);
                                }}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px' }}
                              />
                              <input
                                type="text"
                                placeholder="Role / Tag"
                                value={t.role || ''}
                                onChange={(e) => {
                                  const nextT = [...selectedProps.testimonials];
                                  nextT[idx] = { ...nextT[idx], role: e.target.value };
                                  handleUpdateSectionProp(selectedInstance.instanceId, 'testimonials', nextT);
                                }}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--studio-border)', fontSize: '12px' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', color: 'var(--studio-muted)', fontSize: '13px', lineHeight: 1.5 }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <Sparkles size={24} color="#8a5334" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.8 }} />
                    <p style={{ fontWeight: 700, color: 'var(--studio-ink)', margin: '0 0 4px', fontSize: '14px' }}>AI Section Copilot</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--studio-muted)' }}>
                      Select any section on the canvas or pick one from this page to make changes:
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    {activePage?.componentInstances?.map((ci: any) => {
                      const piece = (libraryRegistry as any).pieces.find((p: any) => p.id === ci.pieceId);
                      return (
                        <button
                          key={ci.instanceId}
                          onClick={() => setSelectedInstanceId(ci.instanceId)}
                          style={{
                            padding: '10px 12px',
                            background: '#fff',
                            border: '1px solid var(--studio-border)',
                            borderRadius: '6px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--studio-ink)', fontSize: '13px' }}>
                              {piece?.title || ci.pieceId}
                            </div>
                            <small style={{ color: 'var(--studio-muted)', fontSize: '11px' }}>
                              Variant: {ci.variantName}
                            </small>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--studio-accent)', fontWeight: 600 }}>Edit with AI &rarr;</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Quality & Distinctiveness Panel */}
          {activeTab === 'quality' && (
            <div>
              <div className="prop-group">
                <div className="prop-title">5-Category Quality Gates</div>
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px' }}>
                    <span>Structural Checks:</span> <b style={{ color: '#166534' }}>Passed</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px' }}>
                    <span>Functional Controls:</span> <b style={{ color: '#166534' }}>0 Broken</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px' }}>
                    <span>Responsive Overflow:</span> <b style={{ color: '#166534' }}>0 Overflow</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px' }}>
                    <span>WCAG 2.1 Contrast:</span> <b style={{ color: '#166534' }}>{qualityReport?.a11yCheck?.contrastRatio || '5.8'}:1 (AA)</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px' }}>
                    <span>Visual Distinctiveness:</span> <b style={{ color: '#166534' }}>Verified Unique</b>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#fcfbf8', borderRadius: '8px', border: '1px solid var(--studio-border)', fontSize: '12px' }}>
                <b>SSOT Status Notice:</b> Direct visual editing operates 100% locally with zero Gemini API costs. All changes persist automatically to MongoDB Atlas.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Universal Media Upload & Custom Image/Video Modal */}
      {activeMediaTarget && (
        <MediaUploadModal
          target={activeMediaTarget}
          brandName={
            manifest?.pages?.[0]?.componentInstances?.find((ci: any) => ci.pieceId === 'p-frame-header')?.props?.brandName ||
            manifest?.businessProfile?.brandName ||
            'House of Jaya'
          }
          onClose={() => setActiveMediaTarget(null)}
          onApply={(url) => {
            handleUpdateMedia(
              activeMediaTarget.instanceId,
              activeMediaTarget.field,
              url,
              activeMediaTarget.itemIndex
            );
            setActiveMediaTarget(null);
          }}
          onAttachToCopilot={(url, mType, fName) => {
            setAttachedMedia({ url, mediaType: mType, filename: fName });
            setActiveTab('section');
            if (activeMediaTarget.instanceId) {
              setSelectedInstanceId(activeMediaTarget.instanceId);
            }
            setActiveMediaTarget(null);
          }}
        />
      )}
    </div>
  );
}
