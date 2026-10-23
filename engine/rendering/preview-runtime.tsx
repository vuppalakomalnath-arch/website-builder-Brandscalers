'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CompositionManifest, ComponentInstance } from '@/lib/schemas/composition-manifest.schema';
import { DesignSystem } from '@/lib/schemas/design-system.schema';
import { ContentBlock } from '@/lib/schemas/content-block.schema';
import libraryRegistry from '@/registry/library-registry.json';

export interface MediaTarget {
  instanceId: string;
  field: string;
  itemIndex?: number;
  mediaType: 'image' | 'video' | 'logo';
  currentUrl?: string;
  title?: string;
}

export interface WebsitePreviewProps {
  manifest: CompositionManifest;
  designSystem: DesignSystem;
  contentBlocks: ContentBlock[];
  activePageSlug?: string;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  selectedInstanceId?: string | null;
  onSelectInstance?: (instanceId: string) => void;
  onNavigatePage?: (slug: string) => void;
  onSectionPropChange?: (instanceId: string, field: string, value: any) => void;
  onMediaClick?: (target: MediaTarget) => void;
  isEditable?: boolean;
}

export function WebsitePreview({
  manifest,
  designSystem,
  contentBlocks,
  activePageSlug = 'home',
  viewport = 'desktop',
  selectedInstanceId,
  onSelectInstance,
  onNavigatePage,
  onSectionPropChange,
  onMediaClick,
  isEditable = false,
}: WebsitePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePage = manifest.pages.find((p) => p.slug === activePageSlug) || manifest.pages[0];

  // Local interactive UI state for tabs / carousels / accordions
  const [activeMenuTab, setActiveMenuTab] = useState<string>('All');
  const [activeCarouselSlide, setActiveCarouselSlide] = useState<number>(0);

  // Map registry pieces
  const registryMap = useMemo(() => {
    const map = new Map<string, any>();
    (libraryRegistry as any).pieces.forEach((p: any) => {
      map.set(p.id, p);
    });
    return map;
  }, []);

  // Intercept navigation links (Header, Footer, CTAs)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      e.preventDefault();
      e.stopPropagation();

      if (href.startsWith('#')) {
        const targetId = href.slice(1);
        const el = container.querySelector(`#${targetId}`) || document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (href.startsWith('/')) {
        const slug = href.replace(/^\//, '') || 'home';
        if (onNavigatePage) {
          onNavigatePage(slug);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [onNavigatePage, activePage]);

  // Auto-scroll canvas to selected section
  useEffect(() => {
    if (!selectedInstanceId || !containerRef.current) return;
    try {
      const el = containerRef.current.querySelector(`[id="${selectedInstanceId}"]`) || document.getElementById(selectedInstanceId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (e) {}
  }, [selectedInstanceId]);

  // Handle in-place contentEditable inputs
  const handleBlurOrInput = (instanceId: string, field: string, e: React.FormEvent<HTMLElement>) => {
    if (!onSectionPropChange) return;
    const newText = (e.target as HTMLElement).innerText.trim();
    onSectionPropChange(instanceId, field, newText);
  };

  const viewportWidth =
    viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%';

  return (
    <div
      ref={containerRef}
      className="preview-viewport-wrapper"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: viewport === 'desktop' ? '0' : '20px 0',
      }}
    >
      {/* Dynamic Google Fonts Link */}
      {designSystem.googleFontsUrl && (
        <link rel="stylesheet" href={designSystem.googleFontsUrl} />
      )}

      <div
        className="bs-preview-stage bs"
        data-viewport={viewport}
        style={{
          width: viewportWidth,
          maxWidth: '100%',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          color: 'var(--ink)',
          overflowX: 'clip',
          ...designSystem.computedTokens,
        }}
        {...designSystem.rootAttributes}
      >
        {activePage?.componentInstances.map((ci: ComponentInstance) => {
          if (!ci.isVisible) return null;
          const isSelected = selectedInstanceId === ci.instanceId;
          const piece = registryMap.get(ci.pieceId);
          const p = ci.props || {};
          const variant = ci.variantName || 'default';

          // Selection badge renderer
          const renderActiveBadge = () => {
            if (!isSelected) return null;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '16px',
                  background: 'var(--accent, #8c593b)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                Active: {piece?.title || ci.pieceId} &bull; {variant}
              </div>
            );
          };

          // 1. FRAME HEADER (Variants: classic, centered-logo, transparent, sticky-compact, split)
          if (ci.pieceId === 'p-frame-header') {
            const isCenteredLogo = variant === 'centered-logo';
            const isTransparent = variant === 'transparent';
            const isCompact = variant === 'sticky-compact';
            const isSplit = variant === 'split';

            return (
              <header
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: isCompact ? '8px 0' : isCenteredLogo ? '20px 0 14px' : '16px 0',
                  borderBottom: isTransparent ? 'none' : '1px solid var(--line)',
                  background: isTransparent ? 'transparent' : 'var(--bg)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 40,
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap" style={{ textAlign: isCenteredLogo ? 'center' : 'left' }}>
                  {(() => {
                    const brandName = p.brandName || 'Website Studio';
                    const words = brandName.trim().split(/\s+/).filter(Boolean);
                    const initials = ((words[0]?.[0] || 'W') + (words[1]?.[0] || words[0]?.[1] || 'S')).toUpperCase();

                    const renderLogoEl = (isCenter = false) => (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: isEditable ? 'pointer' : 'default',
                          marginBottom: isCenter ? '12px' : 0,
                        }}
                        title={isEditable ? 'Click logo to upload or change logo' : undefined}
                      >
                        <div
                          onClick={(e) => {
                            if (isEditable && onMediaClick) {
                              e.stopPropagation();
                              onMediaClick({
                                instanceId: ci.instanceId,
                                field: 'logoUrl',
                                mediaType: 'logo',
                                currentUrl: p.logoUrl,
                                title: `Brand Logo for ${brandName}`,
                              });
                            }
                          }}
                          style={{
                            width: isCenter ? '48px' : '40px',
                            height: isCenter ? '48px' : '40px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: p.logoUrl
                              ? 'transparent'
                              : 'linear-gradient(135deg, var(--accent, #b45309) 0%, #1c1917 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: isCenter ? '16px' : '14px',
                            letterSpacing: '0.05em',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            border: '1px solid var(--line, rgba(0,0,0,0.1))',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          {p.logoUrl ? (
                            <img
                              src={p.logoUrl}
                              alt={brandName}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                          {isEditable && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.45)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0')}
                            >
                              📷
                            </div>
                          )}
                        </div>

                        <a
                          href="/"
                          style={{
                            fontSize: isCenter ? '22px' : '18px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            color: 'var(--ink)',
                            letterSpacing: '-0.02em',
                          }}
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlurOrInput(ci.instanceId, 'brandName', e)}
                        >
                          {brandName}
                        </a>
                      </div>
                    );

                    if (isCenteredLogo) {
                      return (
                        <div>
                          {renderLogoEl(true)}
                          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {manifest.pages.map((pg) => (
                              <a
                                key={pg.slug}
                                href={pg.slug === 'home' ? '/' : `/${pg.slug}`}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: activePageSlug === pg.slug ? 700 : 500,
                                  color: activePageSlug === pg.slug ? 'var(--ink)' : 'var(--muted)',
                                  textDecoration: 'none',
                                  borderBottom: activePageSlug === pg.slug ? '2px solid var(--accent)' : '2px solid transparent',
                                  paddingBottom: '2px',
                                }}
                              >
                                {pg.slug === 'home' ? 'Home' : pg.slug === 'faq' ? 'FAQs' : pg.slug === 'about' ? 'About Us' : pg.slug.charAt(0).toUpperCase() + pg.slug.slice(1)}
                              </a>
                            ))}
                          </nav>
                        </div>
                      );
                    }

                    if (isSplit) {
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '24px' }}>
                          {renderLogoEl(false)}
                          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {manifest.pages.map((pg) => (
                              <a
                                key={pg.slug}
                                href={pg.slug === 'home' ? '/' : `/${pg.slug}`}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: activePageSlug === pg.slug ? 700 : 500,
                                  color: activePageSlug === pg.slug ? 'var(--ink)' : 'var(--muted)',
                                  textDecoration: 'none',
                                }}
                              >
                                {pg.slug === 'home' ? 'Home' : pg.slug === 'faq' ? 'FAQs' : pg.slug === 'about' ? 'About Us' : pg.slug.charAt(0).toUpperCase() + pg.slug.slice(1)}
                              </a>
                            ))}
                          </nav>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={p.ctaHref || '#contact'} className="btn sm">
                              {p.ctaLabel || 'Contact'}
                            </a>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        {renderLogoEl(false)}
                        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {manifest.pages.map((pg) => (
                            <a
                              key={pg.slug}
                              href={pg.slug === 'home' ? '/' : `/${pg.slug}`}
                              style={{
                                fontSize: '14px',
                                fontWeight: activePageSlug === pg.slug ? 700 : 500,
                                color: activePageSlug === pg.slug ? 'var(--ink)' : 'var(--muted)',
                                textDecoration: 'none',
                                borderBottom: activePageSlug === pg.slug ? '2px solid var(--accent)' : '2px solid transparent',
                                paddingBottom: '2px',
                              }}
                            >
                              {pg.slug === 'home'
                                ? 'Home'
                                : pg.slug === 'faq'
                                ? 'FAQs'
                                : pg.slug === 'about'
                                ? 'About Us'
                                : pg.slug.charAt(0).toUpperCase() + pg.slug.slice(1)}
                            </a>
                          ))}
                          <a href={p.ctaHref || '#contact'} className="btn sm">
                            {p.ctaLabel || 'Contact'}
                          </a>
                        </nav>
                      </div>
                    );
                  })()}
                </div>
              </header>
            );
          }

          // 2. FRAME FOOTER (Variants: minimal, columns, big-cta)
          if (ci.pieceId === 'p-frame-footer') {
            const isMinimal = variant === 'minimal';
            const isBigCta = variant === 'big-cta';

            return (
              <footer
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: isMinimal ? '28px 0' : '48px 0 32px',
                  borderTop: '1px solid var(--line)',
                  background: 'var(--footer-bg)',
                  color: 'var(--footer-ink)',
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                {isBigCta && (
                  <div className="wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '36px', marginBottom: '36px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', margin: '0 0 10px', color: '#fff' }}>
                      Ready to elevate your experience?
                    </h2>
                    <p style={{ opacity: 0.8, maxWidth: '50ch', margin: '0 auto 20px', fontSize: '15px' }}>
                      Connect with our team to discuss customized options tailored to your needs.
                    </p>
                    <a href="#contact" className="btn" style={{ background: '#fff', color: '#000' }}>
                      Get in Touch
                    </a>
                  </div>
                )}
                {isMinimal ? (
                  <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{p.brandName || 'Website Studio'}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      {manifest.pages.map((pg) => (
                        <a key={pg.slug} href={pg.slug === 'home' ? '/' : `/${pg.slug}`} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>
                          {pg.slug === 'home' ? 'Home' : pg.slug.charAt(0).toUpperCase() + pg.slug.slice(1)}
                        </a>
                      ))}
                    </div>
                    <small style={{ opacity: 0.6, fontSize: '12px' }}>
                      {p.copyright || `© ${new Date().getFullYear()} ${p.brandName || 'Website Studio'}.`}
                    </small>
                  </div>
                ) : (
                  <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
                    <div>
                      <h3
                        style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'brandName', e)}
                      >
                        {p.brandName || 'Website Studio'}
                      </h3>
                      <p
                        style={{ opacity: 0.8, fontSize: '14px', maxWidth: '44ch' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'tagline', e)}
                      >
                        {p.tagline || 'Thoughtfully crafted with modern natural aesthetics and purposeful design.'}
                      </p>
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        {manifest.pages.map((pg) => (
                          <a
                            key={pg.slug}
                            href={pg.slug === 'home' ? '/' : `/${pg.slug}`}
                            style={{ color: 'inherit', textDecoration: 'none', fontSize: '14px', opacity: 0.85 }}
                          >
                            {pg.slug === 'home'
                              ? 'Home'
                              : pg.slug === 'faq'
                              ? 'FAQs'
                              : pg.slug === 'about'
                              ? 'About Us'
                              : pg.slug.charAt(0).toUpperCase() + pg.slug.slice(1)}
                          </a>
                        ))}
                      </div>
                      <small style={{ opacity: 0.6, fontSize: '12px', display: 'block' }}>
                        {p.copyright || `© ${new Date().getFullYear()} ${p.brandName || 'Website Studio'}. All rights reserved.`}
                      </small>
                    </div>
                  </div>
                )}
              </footer>
            );
          }

          // 3. OPENER HERO (10 Variants: split, centered, fullscreen-image, dark-overlay, with-search, with-form, with-booking, carousel, video, banner)
          if (ci.category === 'opener' && ci.pieceId.includes('hero')) {
            const isSplit = variant === 'split' || variant === 'default';
            const isCentered = variant === 'centered';
            const isFullscreen = variant === 'fullscreen-image';
            const isDark = variant === 'dark-overlay';
            const isSearch = variant === 'with-search';
            const isForm = variant === 'with-form';
            const isBooking = variant === 'with-booking';
            const isCarousel = variant === 'carousel';
            const isVideo = variant === 'video';
            const isBanner = variant === 'banner';

            const bgStyle = isFullscreen
              ? (p.imageUrl
                  ? `linear-gradient(135deg, rgba(20, 20, 20, 0.85), rgba(45, 38, 30, 0.8)), url('${p.imageUrl}') center/cover no-repeat`
                  : 'linear-gradient(135deg, rgba(20, 20, 20, 0.90), rgba(45, 38, 30, 0.85))')
              : isDark
              ? (p.imageUrl
                  ? `linear-gradient(135deg, rgba(10, 10, 10, 0.88), rgba(20, 20, 20, 0.85)), url('${p.imageUrl}') center/cover no-repeat`
                  : 'var(--ink)')
              : 'transparent';

            const textColor = (isFullscreen || isDark) ? '#ffffff' : 'inherit';
            const mutedColor = (isFullscreen || isDark) ? 'rgba(255,255,255,0.78)' : 'var(--muted)';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec hero ${isSelected ? 'selected-section' : ''}`}
                style={{
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  background: bgStyle,
                  color: textColor,
                  padding: isBanner ? '40px 0' : isFullscreen ? '90px 0 80px' : undefined,
                }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div
                    style={{
                      display: (isSplit || isBooking || isForm || isVideo) ? 'grid' : 'block',
                      gridTemplateColumns: (isSplit || isBooking || isForm || isVideo) ? '1.15fr 0.85fr' : undefined,
                      gap: '40px',
                      alignItems: 'center',
                      textAlign: (isCentered || isFullscreen || isCarousel) ? 'center' : 'left',
                      maxWidth: (isCentered || isFullscreen || isCarousel) ? '840px' : '100%',
                      margin: (isCentered || isFullscreen || isCarousel) ? '0 auto' : '0',
                    }}
                  >
                    {/* Left or Main Narrative */}
                    <div>
                      {p.eyebrow && (
                        <span
                          className="eyebrow"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlurOrInput(ci.instanceId, 'eyebrow', e)}
                          style={{ color: (isFullscreen || isDark) ? 'var(--accent, #d49a6a)' : undefined }}
                        >
                          {p.eyebrow}
                        </span>
                      )}
                      <h1
                        style={{
                          fontSize: isBanner ? 'clamp(28px, 3.5vw, 42px)' : 'clamp(32px, 4.4vw, 54px)',
                          fontWeight: 'var(--hw)',
                          lineHeight: 1.15,
                          margin: '8px 0 16px',
                          color: (isFullscreen || isDark) ? '#ffffff' : undefined,
                        }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                      >
                        {p.heading || 'Welcome to Our Studio'}
                      </h1>
                      <p
                        className="sub"
                        style={{
                          fontSize: 'clamp(16px, 1.8vw, 19px)',
                          marginBottom: '28px',
                          color: mutedColor,
                          maxWidth: (isSplit || isBooking || isForm || isVideo) ? '100%' : '65ch',
                          margin: (isCentered || isFullscreen || isCarousel) ? '0 auto 28px' : '0 0 28px',
                        }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                      >
                        {p.subheading || 'Discover authentic quality designed for modern living.'}
                      </p>

                      {/* Variant: with-search */}
                      {isSearch && (
                        <div style={{ maxWidth: '480px', margin: isCentered ? '0 auto 24px' : '0 0 24px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Search catalog, styles, or services..."
                            style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--btn-r, 8px)', border: '1px solid var(--line)', background: '#fff' }}
                          />
                          <button className="btn">Search</button>
                        </div>
                      )}

                      {/* Variant: carousel dots */}
                      {isCarousel && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                          {[0, 1, 2].map((dot) => (
                            <button
                              key={dot}
                              onClick={(e) => { e.stopPropagation(); setActiveCarouselSlide(dot); }}
                              style={{
                                width: dot === activeCarouselSlide ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: dot === activeCarouselSlide ? 'var(--accent)' : 'var(--line)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* CTAs */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: (isCentered || isFullscreen || isCarousel) ? 'center' : 'flex-start' }}>
                        {p.ctaLabel && (
                          <a
                            href={p.ctaHref || '#'}
                            className="btn"
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleBlurOrInput(ci.instanceId, 'ctaLabel', e)}
                            style={{ background: isFullscreen ? '#fff' : undefined, color: isFullscreen ? '#000' : undefined }}
                          >
                            {p.ctaLabel}
                          </a>
                        )}
                        {p.secondaryCtaLabel && (
                          <a
                            href={p.secondaryCtaHref || '#'}
                            className="btn outline"
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleBlurOrInput(ci.instanceId, 'secondaryCtaLabel', e)}
                            style={{ color: (isFullscreen || isDark) ? '#ffffff' : undefined, borderColor: (isFullscreen || isDark) ? 'rgba(255,255,255,0.4)' : undefined }}
                          >
                            {p.secondaryCtaLabel}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right Showcase for Split Hero */}
                    {isSplit && (
                      <div
                        className="card"
                        style={{
                          background: 'var(--surface)',
                          padding: '24px 20px',
                          borderRadius: 'var(--rad, 16px)',
                          border: '1px solid var(--line)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span className="badge" style={{ background: 'var(--accent)', color: '#fff' }}>Flagship Edition</span>
                          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>★ 4.9/5 (1.2k Reviews)</span>
                        </div>
                        <div
                          onClick={(e) => {
                            if (isEditable && onMediaClick) {
                              e.stopPropagation();
                              onMediaClick({
                                instanceId: ci.instanceId,
                                field: 'imageUrl',
                                mediaType: 'image',
                                currentUrl: p.imageUrl,
                                title: 'Hero Showcase Image',
                              });
                            }
                          }}
                          style={{
                            height: '210px',
                            borderRadius: '10px',
                            background: 'var(--bg)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '14px',
                            border: p.imageUrl ? 'none' : '2px dashed var(--line)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: isEditable ? 'pointer' : 'default',
                          }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.heading || 'Hero Showcase'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                              <span style={{ fontSize: '26px' }}>📷</span>
                              <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600, marginTop: '4px' }}>
                                {isEditable ? '+ Click to Add Showcase Image' : 'Visual Collection Preview'}
                              </div>
                              <small style={{ color: 'var(--muted)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                JPG, PNG up to 5MB
                              </small>
                            </div>
                          )}
                          {isEditable && p.imageUrl && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              📷 Change Image
                            </div>
                          )}
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>Authentic Materials &amp; Timeless Finish</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                          Every piece is handcrafted with precision, designed to elevate your everyday spaces.
                        </p>
                      </div>
                    )}

                    {/* Right Booking Card for Hero with Booking */}
                    {isBooking && (
                      <div
                        className="card"
                        style={{
                          background: '#fff',
                          padding: '28px 24px',
                          borderRadius: 'var(--rad, 16px)',
                          border: '1px solid var(--line)',
                          boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
                        }}
                      >
                        <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700 }}>Reserve Consultation</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)' }}>Select your preferred consultation window.</p>
                        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                          <button className="studio-btn" style={{ justifyContent: 'space-between', padding: '10px 14px', background: '#faf9f6' }}>
                            <span>📅 Tomorrow, Available</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Open</span>
                          </button>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                            {['10:00 AM', '02:30 PM', '05:00 PM'].map((slot, idx) => (
                              <button key={slot} className="studio-btn" style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', background: idx === 0 ? '#f5f0eb' : '#fff' }}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                        <a href="#book" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                          Confirm Booking Slot
                        </a>
                      </div>
                    )}

                    {/* Right Form Card for Hero with Form */}
                    {isForm && (
                      <div
                        className="card"
                        style={{
                          background: '#fff',
                          padding: '28px 24px',
                          borderRadius: 'var(--rad, 16px)',
                          border: '1px solid var(--line)',
                          boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
                        }}
                      >
                        <span className="badge" style={{ marginBottom: '8px' }}>Direct Inquiry</span>
                        <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Request Priority Consultation</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)' }}>Direct channel to our lead specialist.</p>
                        <form onSubmit={(e) => { e.preventDefault(); alert('Inquiry submitted!'); }} style={{ display: 'grid', gap: '10px' }}>
                          <input type="text" placeholder="Your Name" required style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <input type="email" placeholder="Email / Phone" required style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
                            Submit Request &rarr;
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Right Video Showcase for Video Hero */}
                    {isVideo && (
                      <div
                        className="card"
                        onClick={(e) => {
                          if (isEditable && onMediaClick) {
                            e.stopPropagation();
                            onMediaClick({
                              instanceId: ci.instanceId,
                              field: 'videoUrl',
                              mediaType: 'video',
                              currentUrl: p.videoUrl,
                              title: 'Hero Video Banner',
                            });
                          }
                        }}
                        style={{
                          background: 'var(--surface)',
                          borderRadius: 'var(--rad, 16px)',
                          height: '240px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          border: '1px solid var(--line)',
                          overflow: 'hidden',
                          cursor: isEditable ? 'pointer' : 'default',
                        }}
                      >
                        {p.videoUrl ? (
                          p.videoUrl.includes('youtube.com/embed') ? (
                            <iframe
                              src={p.videoUrl}
                              title="Video Showcase"
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={p.videoUrl}
                              controls
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )
                        ) : (
                          <>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '20px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                              ▶
                            </div>
                            <span style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                              {isEditable ? '+ Click to Add Video or YouTube Link' : 'Watch Brand Showcase (02:40)'}
                            </span>
                            <small style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                              MP4, MP3 up to 10MB or YouTube embed
                            </small>
                          </>
                        )}
                        {isEditable && p.videoUrl && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            ▶ Edit Video
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          // 4. OPENER PAGE HEADER (Variants: plain, with-image, split)
          if (ci.category === 'opener' && ci.pieceId.includes('page-header')) {
            const isWithImage = variant === 'with-image';
            const isSplitHeader = variant === 'split';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: '48px 0 28px',
                  borderBottom: '1px solid var(--line)',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  {isWithImage ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                      <div>
                        {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, margin: '6px 0 10px' }}>
                          {p.heading || activePage?.title}
                        </h1>
                        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '54ch', margin: 0 }}>
                          {p.subheading || (activePage as any)?.pagePurpose || (activePage as any)?.seo?.description}
                        </p>
                      </div>
                      <div
                        onClick={(e) => {
                          if (isEditable && onMediaClick) {
                            e.stopPropagation();
                            onMediaClick({
                              instanceId: ci.instanceId,
                              field: 'imageUrl',
                              mediaType: 'image',
                              currentUrl: p.imageUrl,
                              title: `${p.heading || activePage?.title || 'Page'} Banner Image`,
                            });
                          }
                        }}
                        style={{
                          height: '180px',
                          borderRadius: '12px',
                          background: 'var(--surface)',
                          border: p.imageUrl ? 'none' : '2px dashed var(--line)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: isEditable ? 'pointer' : 'default',
                        }}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt="Banner"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🖼️</span>
                            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px', fontWeight: 600 }}>
                              {isEditable ? '+ Click to Add Banner Image' : 'Page Collection Banner'}
                            </div>
                            <small style={{ fontSize: '11px', color: 'var(--muted)' }}>JPG, PNG up to 5MB</small>
                          </div>
                        )}
                        {isEditable && p.imageUrl && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            📷 Change
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isSplitHeader ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '36px', alignItems: 'baseline' }}>
                      <div>
                        {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, margin: '6px 0 0' }}>
                          {p.heading || activePage?.title}
                        </h1>
                      </div>
                      <div>
                        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '60ch', margin: 0 }}>
                          {p.subheading || (activePage as any)?.pagePurpose || (activePage as any)?.seo?.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                      <h1
                        style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, margin: '6px 0 10px' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                      >
                        {p.heading || activePage?.title}
                      </h1>
                      <p
                        className="sub"
                        style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '64ch', margin: 0 }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                      >
                        {p.subheading || (activePage as any)?.pagePurpose || (activePage as any)?.seo?.description}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 5. OFFER: PRODUCT GRID / SERVICES GRID (Variants: 2-col, 3-col, 4-col, list, quick-view, icon-cards, image-cards)
          if (ci.pieceId.includes('product-grid') || (ci.category === 'offer' && p.items && !ci.pieceId.includes('category') && !ci.pieceId.includes('feature')) || ci.pieceId.includes('services-grid')) {
            const items = Array.isArray(p.items) && p.items.length > 0 ? p.items : [
              { title: 'Flagship Collection Item 1', description: 'Exceptional craftsmanship and verified durability.', badge: '₹1,999' },
              { title: 'Signature Solution Item 2', description: 'Clean modern design tailored for daily use.', badge: '₹2,499' },
              { title: 'Handcrafted Piece Item 3', description: 'Sustainably sourced natural materials.', badge: '₹1,450' },
            ];

            const isList = variant === 'list';
            const isIconCards = variant === 'icon-cards';
            const isImageCards = variant === 'image-cards';
            const isQuickView = variant === 'quick-view';

            const gridCols =
              variant === '2-col'
                ? 'repeat(2, 1fr)'
                : variant === '4-col'
                ? 'repeat(auto-fit, minmax(210px, 1fr))'
                : 'repeat(auto-fit, minmax(260px, 1fr))';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                    <h2
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                    >
                      {p.heading || 'Curated Offerings'}
                    </h2>
                    <p
                      className="sub"
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                    >
                      {p.subheading || 'Thoughtfully selected for quality and lasting satisfaction.'}
                    </p>
                  </div>

                  {isList ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px', flex: 1 }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                              0{idx + 1}
                            </div>
                            <div>
                              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{item.title}</h3>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{item.description}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {item.badge && <span className="badge" style={{ fontSize: '14px', fontWeight: 700 }}>{item.badge}</span>}
                            <a href={p.ctaHref || '#'} className="btn sm">
                              {p.ctaLabel || 'View Details'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isIconCards ? (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '20px' }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--accent)', marginBottom: '16px' }}>
                              ✦
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>{item.title}</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.55, margin: 0 }}>{item.description}</p>
                          </div>
                          {item.badge && <span className="badge" style={{ marginTop: '16px', width: 'fit-content' }}>{item.badge}</span>}
                        </div>
                      ))}
                    </div>
                  ) : isImageCards ? (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '24px' }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          <div
                            onClick={(e) => {
                              if (isEditable && onMediaClick) {
                                e.stopPropagation();
                                onMediaClick({
                                  instanceId: ci.instanceId,
                                  field: 'items',
                                  itemIndex: idx,
                                  mediaType: 'image',
                                  currentUrl: item.imageUrl,
                                  title: item.title || `Item ${idx + 1}`,
                                });
                              }
                            }}
                            style={{
                              height: '180px',
                              background: 'var(--surface)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--muted)',
                              borderBottom: '1px solid var(--line)',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: isEditable ? 'pointer' : 'default',
                            }}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '20px' }}>🖼️</span>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                                  {isEditable ? '+ Add Image (≤ 5MB)' : `Visual Catalog 0${idx + 1}`}
                                </div>
                              </div>
                            )}
                            {isEditable && item.imageUrl && (
                              <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                📷 Change
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>{item.title}</h3>
                                {item.badge && <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{item.badge}</span>}
                              </div>
                              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                            </div>
                            <a href={p.ctaHref || '#'} className="btn outline sm" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                              {p.ctaLabel || 'Explore'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '20px' }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                          {isQuickView && (
                            <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--surface)', color: 'var(--ink)', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                              Quick Preview
                            </span>
                          )}
                          <div>
                            <div
                              onClick={(e) => {
                                if (isEditable && onMediaClick) {
                                  e.stopPropagation();
                                  onMediaClick({
                                    instanceId: ci.instanceId,
                                    field: 'items',
                                    itemIndex: idx,
                                    mediaType: 'image',
                                    currentUrl: item.imageUrl,
                                    title: item.title || `Item ${idx + 1}`,
                                  });
                                }
                              }}
                              style={{
                                height: '140px',
                                background: 'var(--surface)',
                                borderRadius: '6px',
                                marginBottom: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--muted)',
                                fontSize: '12px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: isEditable ? 'pointer' : 'default',
                                border: item.imageUrl ? 'none' : '1px dashed var(--line)',
                              }}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ textAlign: 'center' }}>
                                  <span style={{ fontSize: '18px' }}>🖼️</span>
                                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                                    {isEditable ? '+ Add Photo (≤ 5MB)' : `Collection Item 0${idx + 1}`}
                                  </div>
                                </div>
                              )}
                              {isEditable && item.imageUrl && (
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                  📷 Change
                                </div>
                              )}
                            </div>
                            {item.badge && (
                              <span className="badge" style={{ marginBottom: '10px' }}>
                                {item.badge}
                              </span>
                            )}
                            <h3
                              style={{ fontSize: '17px', fontWeight: 600, margin: '8px 0 6px' }}
                              contentEditable={isEditable}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const nextItems = [...items];
                                nextItems[idx] = { ...nextItems[idx], title: (e.target as HTMLElement).innerText };
                                onSectionPropChange?.(ci.instanceId, 'items', nextItems);
                              }}
                            >
                              {item.title}
                            </h3>
                            <p
                              style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}
                              contentEditable={isEditable}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const nextItems = [...items];
                                nextItems[idx] = { ...nextItems[idx], description: (e.target as HTMLElement).innerText };
                                onSectionPropChange?.(ci.instanceId, 'items', nextItems);
                              }}
                            >
                              {item.description}
                            </p>
                          </div>
                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={p.ctaHref || '#'} className="btn outline sm">
                              {p.ctaLabel || 'Add to Bag'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 6. OFFER: CATEGORY TILES (Variants: mosaic, equal-grid, carousel)
          if (ci.pieceId.includes('category-tiles')) {
            const categories = [
              { title: 'Living & Comfort', count: '14 Pieces' },
              { title: 'Kitchen & Dining', count: '9 Pieces' },
              { title: 'Bedding & Linens', count: '12 Pieces' },
              { title: 'Artisanal Ceramics', count: '8 Pieces' },
            ];

            const isMosaic = variant === 'mosaic';
            const isCarouselTiles = variant === 'carousel';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">{p.eyebrow || 'Curated Lines'}</span>
                    <h2>{p.heading || 'Browse By Category'}</h2>
                    <p className="sub">{p.subheading || 'Discover specialized craft for every space.'}</p>
                  </div>

                  {isMosaic ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                      <div className="card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                        <span className="badge" style={{ width: 'fit-content' }}>Flagship Collection</span>
                        <div>
                          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px' }}>{categories[0].title}</h3>
                          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Signature craft and core essentials for modern spaces.</p>
                        </div>
                        <a href="/shop" className="btn sm" style={{ width: 'fit-content' }}>Explore Collection &rarr;</a>
                      </div>
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {categories.slice(1, 3).map((c, idx) => (
                          <div key={idx} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{c.title}</h4>
                              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.count}</small>
                            </div>
                            <span style={{ fontSize: '18px', color: 'var(--accent)' }}>&rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isCarouselTiles ? (
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                      {categories.map((c, idx) => (
                        <div key={idx} className="card" style={{ minWidth: '240px', padding: '24px', flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg)', margin: '0 auto 12px', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                            0{idx + 1}
                          </div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{c.title}</h4>
                          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.count}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      {categories.map((c, idx) => (
                        <div key={idx} className="card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg)', margin: '0 auto 12px', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                            0{idx + 1}
                          </div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{c.title}</h4>
                          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.count}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 7. OFFER: FEATURE ROWS (Variants: text-left-image-right, text-right-image-left, stacked)
          if (ci.pieceId.includes('feature-rows')) {
            const isReverse = variant === 'text-right-image-left';
            const isStacked = variant === 'stacked';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  {isStacked ? (
                    <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
                      <span className="eyebrow">{p.eyebrow || 'Provenance & Craft'}</span>
                      <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', margin: '8px 0 16px' }}>
                        {p.heading || 'Meticulously Designed, Naturally Sourced'}
                      </h2>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                        {p.subheading || 'We believe objects should last a lifetime. Our pieces are crafted using verified sustainable materials with zero short-cuts.'}
                      </p>
                      <div
                        onClick={(e) => {
                          if (isEditable && onMediaClick) {
                            e.stopPropagation();
                            onMediaClick({
                              instanceId: ci.instanceId,
                              field: 'imageUrl',
                              mediaType: 'image',
                              currentUrl: p.imageUrl,
                              title: `${p.heading || 'Feature'} Panoramic Showcase`,
                            });
                          }
                        }}
                        style={{
                          height: '280px',
                          borderRadius: 'var(--rad, 16px)',
                          background: 'var(--surface)',
                          border: p.imageUrl ? 'none' : '1px dashed var(--line)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                          margin: '0 auto 20px',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: isEditable ? 'pointer' : 'default',
                        }}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="Feature Showcase" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '24px' }}>🖼️</span>
                            <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                              {isEditable ? '+ Click to Add Feature Image (≤ 5MB)' : 'Panoramic Atelier Showcase'}
                            </div>
                          </div>
                        )}
                        {isEditable && p.imageUrl && (
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            📷 Change
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center', direction: isReverse ? 'rtl' : 'ltr' }}>
                      <div style={{ direction: 'ltr' }}>
                        <span className="eyebrow">{p.eyebrow || 'Provenance & Craft'}</span>
                        <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', margin: '8px 0 16px' }}>
                          {p.heading || 'Meticulously Designed, Naturally Sourced'}
                        </h2>
                        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                          {p.subheading || 'We believe objects should last a lifetime. Our pieces are crafted using verified sustainable materials with zero short-cuts.'}
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--ink)', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
                          <li>100% Traceable supply chain and fair labor</li>
                          <li>Non-toxic organic finishes and natural dyes</li>
                          <li>Certified carbon-neutral packaging</li>
                        </ul>
                      </div>
                      <div
                        onClick={(e) => {
                          if (isEditable && onMediaClick) {
                            e.stopPropagation();
                            onMediaClick({
                              instanceId: ci.instanceId,
                              field: 'imageUrl',
                              mediaType: 'image',
                              currentUrl: p.imageUrl,
                              title: `${p.heading || 'Craftsmanship'} Spotlight`,
                            });
                          }
                        }}
                        style={{
                          direction: 'ltr',
                          height: '260px',
                          borderRadius: 'var(--rad, 16px)',
                          background: 'var(--surface)',
                          border: p.imageUrl ? 'none' : '1px dashed var(--line)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: isEditable ? 'pointer' : 'default',
                        }}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="Craftsmanship Spotlight" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '24px' }}>🖼️</span>
                            <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                              {isEditable ? '+ Click to Add Spotlight Photo (≤ 5MB)' : 'Atelier Craftsmanship Spotlight'}
                            </div>
                          </div>
                        )}
                        {isEditable && p.imageUrl && (
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            📷 Change
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 8. VERTICAL: D2C PRODUCT DETAIL SPOTLIGHT (Variants: gallery-left, stacked)
          if (ci.pieceId.includes('product-detail')) {
            const isStacked = variant === 'stacked';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div style={{ display: isStacked ? 'block' : 'grid', gridTemplateColumns: isStacked ? undefined : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center', textAlign: isStacked ? 'center' : 'left' }}>
                    <div
                      onClick={(e) => {
                        if (isEditable && onMediaClick) {
                          e.stopPropagation();
                          onMediaClick({
                            instanceId: ci.instanceId,
                            field: 'imageUrl',
                            mediaType: 'image',
                            currentUrl: p.imageUrl,
                            title: 'Flagship Product Gallery',
                          });
                        }
                      }}
                      style={{
                        height: isStacked ? '240px' : '320px',
                        borderRadius: '12px',
                        background: 'var(--bg)',
                        border: p.imageUrl ? 'none' : '1px dashed var(--line)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--muted)',
                        marginBottom: isStacked ? '24px' : 0,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: isEditable ? 'pointer' : 'default',
                      }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="Product Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '24px' }}>🖼️</span>
                          <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                            {isEditable ? '+ Click to Add Product Photo (≤ 5MB)' : 'Flagship Product Gallery'}
                          </div>
                        </div>
                      )}
                      {isEditable && p.imageUrl && (
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>
                          📷 Change
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="badge" style={{ background: 'var(--accent)', color: '#fff', marginBottom: '8px' }}>Featured Spotlight</span>
                      <h2 style={{ fontSize: '28px', margin: '8px 0 8px' }}>Hand-Woven Organic Throw</h2>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>₹3,499</div>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px', maxWidth: isStacked ? '60ch' : '100%', margin: isStacked ? '0 auto 20px' : '0 0 20px' }}>
                        Woven by master artisans from heavyweight organic fibers. Breathable, hypoallergenic, and machine-washable.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: isStacked ? 'center' : 'flex-start' }}>
                        {['Natural Oat', 'Earthy Slate', 'Terracotta'].map((c, i) => (
                          <button key={c} className="studio-btn" style={{ padding: '6px 12px', fontSize: '12px', background: i === 0 ? '#f5f0eb' : '#fff' }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <button className="btn" style={{ width: isStacked ? 'auto' : '100%', justifyContent: 'center', padding: isStacked ? '12px 36px' : undefined }}>
                        Add to Bag &bull; Free Shipping
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 9. VERTICAL: CLINIC DOCTOR PROFILE (Variants: photo-card, banner, expanded)
          if (ci.pieceId.includes('doctor-profile')) {
            const isBannerProfile = variant === 'banner';
            const isExpanded = variant === 'expanded';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  {isBannerProfile ? (
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                          DR
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 700 }}>Dr. Ananya Sharma, MDS</h3>
                          <small style={{ color: 'var(--muted)' }}>Lead Clinical Director &bull; Restorative &amp; Gentle Care</small>
                        </div>
                      </div>
                      <a href="#book" className="btn sm">Book with Dr. Sharma</a>
                    </div>
                  ) : (
                    <div className="card" style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap', padding: '32px' }}>
                      <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        DR
                      </div>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <span className="badge" style={{ marginBottom: '6px' }}>Lead Clinical Director</span>
                        <h3 style={{ margin: '4px 0 6px', fontSize: '20px', fontWeight: 700 }}>Dr. Ananya Sharma, MDS, FACS</h3>
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                          Over 14 years specializing in restorative procedures, cosmetic dentistry, and gentle patient-first care.
                        </p>
                        {isExpanded && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <span className="badge" style={{ background: 'var(--surface)' }}>All India Dental Council</span>
                            <span className="badge" style={{ background: 'var(--surface)' }}>Harvard Clinical Scholar</span>
                          </div>
                        )}
                        <small style={{ color: 'var(--accent)', fontWeight: 600 }}>★ 4.96/5 Patient Rating &bull; 4,200+ Treatments Completed</small>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 10. VERTICAL: RESTAURANT MENU (Variants: tabs, accordion, columns)
          if (ci.pieceId.includes('menu')) {
            const menuCourses = [
              { name: 'Artisan Sourdough & Herb Butter', price: '₹350', desc: 'Slow-fermented for 36 hours, served with sea-salted churned butter.', category: 'Starters' },
              { name: 'Wood-Fired Wild Mushroom Risotto', price: '₹850', desc: 'Arborio rice, porcini reduction, aged parmesan, and white truffle essence.', category: 'Mains' },
              { name: 'Dark Chocolate Ganache Tart', price: '₹450', desc: 'Valrhona single-origin chocolate with sea salt flakes and roasted hazelnut cream.', category: 'Desserts' },
              { name: 'Cold-Pressed Citrus Botanicals', price: '₹280', desc: 'Blood orange, rosemary infusion, and sparkling mineral water.', category: 'Beverages' },
            ];

            const isColumns = variant === 'columns';
            const isAccordion = variant === 'accordion';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Seasonal Menu</span>
                    <h2>Culinary Offerings</h2>
                    <p className="sub">Fresh local ingredients sourced from partner farms within 50 miles.</p>
                  </div>

                  {isColumns ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                      {menuCourses.map((dish, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>{dish.name}</span>
                            <span style={{ fontWeight: 800, color: 'var(--accent)', marginLeft: '12px' }}>{dish.price}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{dish.desc}</p>
                        </div>
                      ))}
                    </div>
                  ) : isAccordion ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {menuCourses.map((dish, idx) => (
                        <details key={idx} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }}>
                          <summary style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '15px', outline: 'none' }}>
                            <span>{dish.name}</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{dish.price}</span>
                          </summary>
                          <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                            {dish.desc}
                          </p>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {menuCourses.map((dish, idx) => (
                        <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{dish.name}</h4>
                              <span className="badge" style={{ fontSize: '10px' }}>{dish.category}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{dish.desc}</p>
                          </div>
                          <span className="badge" style={{ fontSize: '15px', fontWeight: 700 }}>{dish.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 11. TRUST: STATS COUNTERS (Variants: counter-row, big-number, cards, grid)
          if (ci.pieceId.includes('numbers')) {
            const stats = [
              { val: '10,000+', lbl: 'Happy Customers' },
              { val: '99.4%', lbl: 'Satisfaction Rate' },
              { val: '100%', lbl: 'Natural Materials' },
              { val: '24/7', lbl: 'Support Concierge' },
            ];

            const isBigNumber = variant === 'big-number';
            const isCards = variant === 'cards';
            const isGrid = variant === 'grid';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ padding: '40px 0', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  {isBigNumber ? (
                    <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
                      <div style={{ fontSize: 'clamp(54px, 7vw, 84px)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{stats[1].val}</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '12px 0 6px' }}>{stats[1].lbl}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                        Validated across more than 10,000 independent client and customer engagements.
                      </p>
                    </div>
                  ) : isCards ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {stats.map((s, idx) => (
                        <div key={idx} className="card" style={{ padding: '24px', textAlign: 'center', background: '#fff' }}>
                          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent)' }}>{s.val}</div>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px', fontWeight: 500 }}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isGrid ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', textAlign: 'center' }}>
                      {stats.map((s, idx) => (
                        <div key={idx}>
                          <div style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>{s.val}</div>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px', fontWeight: 500 }}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 12. TRUST: TESTIMONIALS (Variants: single, carousel, grid, wall, video)
          if (ci.category === 'trust' || ci.pieceId.includes('testimonials')) {
            const testimonials = Array.isArray(p.testimonials) && p.testimonials.length > 0 ? p.testimonials : [
              { quote: 'The attention to detail and honest communication exceeded every expectation.', author: 'Priya Verma', role: 'Verified Client' },
              { quote: 'Effortless experience. Their natural aesthetic truly sets them apart.', author: 'Devendra Sen', role: 'Studio Member' },
              { quote: 'A standard of care that feels personal, refined, and completely genuine.', author: 'Kavita Menon', role: 'Customer' },
            ];

            const isSingle = variant === 'single';
            const isCarouselT = variant === 'carousel';
            const isWall = variant === 'wall';
            const isVideoT = variant === 'video';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">{p.eyebrow || 'Real Experiences'}</span>
                    <h2>{p.heading || 'What Our Community Says'}</h2>
                    <p className="sub">{p.subheading || 'Unfiltered reflections from those who live with our work every day.'}</p>
                  </div>

                  {isSingle ? (
                    <div className="card" style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 36px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '12px' }}>★★★★★</div>
                      <blockquote style={{ fontSize: 'clamp(18px, 2.2vw, 24px)', fontStyle: 'italic', margin: '0 0 20px', lineHeight: 1.4, color: 'var(--ink)' }}>
                        "{testimonials[0].quote}"
                      </blockquote>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{testimonials[0].author}</div>
                      <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{testimonials[0].role}</small>
                    </div>
                  ) : isCarouselT ? (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                      <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
                        <p style={{ fontSize: '17px', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.5 }}>
                          "{testimonials[activeCarouselSlide % testimonials.length]?.quote || testimonials[0].quote}"
                        </p>
                        <div style={{ fontWeight: 700 }}>{testimonials[activeCarouselSlide % testimonials.length]?.author || testimonials[0].author}</div>
                        <small style={{ color: 'var(--muted)' }}>{testimonials[activeCarouselSlide % testimonials.length]?.role || testimonials[0].role}</small>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                        {testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setActiveCarouselSlide(idx); }}
                            style={{
                              width: idx === (activeCarouselSlide % testimonials.length) ? '20px' : '8px',
                              height: '8px',
                              borderRadius: '4px',
                              background: idx === (activeCarouselSlide % testimonials.length) ? 'var(--accent)' : 'var(--line)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : isVideoT ? (
                    <div className="card" style={{ maxWidth: '720px', margin: '0 auto', padding: '32px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: 'var(--surface)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '24px', color: 'var(--accent)' }}>▶</span>
                      </div>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <span className="badge" style={{ marginBottom: '8px' }}>Verified Video Story</span>
                        <blockquote style={{ fontSize: '15px', fontStyle: 'italic', margin: '0 0 10px', color: 'var(--ink)' }}>
                          "{testimonials[0].quote}"
                        </blockquote>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{testimonials[0].author}</div>
                        <small style={{ color: 'var(--muted)' }}>{testimonials[0].role}</small>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isWall ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {testimonials.map((t: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px', color: 'var(--ink)' }}>
                            "{t.quote}"
                          </p>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.author}</div>
                            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>{t.role}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 13. ANSWER: FAQS (Variants: accordion, two-column, cards, tab-list)
          if (ci.category === 'answer' || ci.pieceId.includes('faq')) {
            const faqs = Array.isArray(p.faqs) && p.faqs.length > 0 ? p.faqs : [
              { question: 'What can I expect during our first session?', answer: 'We begin with an unhurried consultation to understand your exact priorities, requirements, and personal preferences.' },
              { question: 'What materials and standards do you utilize?', answer: 'We exclusively work with certified organic, non-toxic, and traceable materials sourced from fair-trade partners.' },
              { question: 'What is your turnaround and appointment schedule?', answer: 'Most initial consultations are scheduled within 48 to 72 hours. Bespoke projects typically take 2-4 weeks.' },
            ];

            const isCardsFaq = variant === 'cards';
            const isTwoCol = variant === 'two-column';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">{p.eyebrow || 'Common Inquiries'}</span>
                    <h2>{p.heading || 'Frequently Asked Questions'}</h2>
                    <p className="sub">{p.subheading || 'Clear, transparent answers to help you make informed decisions.'}</p>
                  </div>

                  {isCardsFaq ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {faqs.map((f: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '24px', background: '#fff' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{f.question}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55 }}>{f.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : isTwoCol ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
                      {faqs.map((f: any, idx: number) => (
                        <div key={idx} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{f.question}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55 }}>{f.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ maxWidth: '740px', margin: '0 auto', display: 'grid', gap: '12px' }}>
                      {faqs.map((f: any, idx: number) => (
                        <details key={idx} className="card" open={idx === 0} style={{ padding: '16px 20px', cursor: 'pointer', background: '#fff' }}>
                          <summary style={{ fontWeight: 600, fontSize: '15px', outline: 'none' }}>{f.question}</summary>
                          <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{f.answer}</p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 14. ACTION: NEWSLETTER (Variants: inline, footer, banner, popup)
          if (ci.pieceId.includes('newsletter')) {
            const isBannerNews = variant === 'banner';
            const isPopup = variant === 'popup';
            const isFooterNews = variant === 'footer';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  background: isBannerNews ? 'var(--surface)' : undefined,
                  padding: isBannerNews ? '48px 0' : undefined,
                }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  {isPopup ? (
                    <div className="card" style={{ padding: '36px 32px', textAlign: 'center', border: '2px solid var(--accent)', background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
                      <span className="badge" style={{ background: 'var(--accent)', color: '#fff', marginBottom: '12px' }}>Exclusive Studio Invitation</span>
                      <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 8px' }}>
                        Join the Private Collector Circle
                      </h3>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '44ch', margin: '0 auto 20px', lineHeight: 1.5 }}>
                        Receive first access to seasonal line releases, private salon previews, and limited edition drops.
                      </p>
                      <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed to VIP Circle!'); }} style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
                        <input type="email" placeholder="Enter your email" required style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        <button type="submit" className="btn sm">Claim Access</button>
                      </form>
                      <small style={{ display: 'block', marginTop: '10px', color: 'var(--muted)', fontSize: '11px' }}>Code: STUDIO15 automatically applied.</small>
                    </div>
                  ) : isFooterNews ? (
                    <div className="card" style={{ padding: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Stay in Touch</h4>
                          <small style={{ color: 'var(--muted)' }}>Weekly insights, stories, and seasonal releases.</small>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
                          <input type="email" placeholder="Your email address" required style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <button type="submit" className="btn sm">Subscribe</button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <span className="eyebrow">Journal &amp; Updates</span>
                      <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 8px' }}>Join Our Community</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '44ch', margin: '0 auto 20px' }}>
                        Thoughtful stories, behind-the-scenes craft, and exclusive early access.
                      </p>
                      <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }} style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
                        <input type="email" placeholder="Enter your email address" required style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        <button type="submit" className="btn sm">Subscribe</button>
                      </form>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 15. ACTION: APPOINTMENT REQUEST (Variants: form, stepper, calendar-picker)
          if (ci.pieceId.includes('appointment')) {
            const isCalendarAppt = variant === 'calendar-picker';
            const isStepper = variant === 'stepper';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  <div className="card" style={{ padding: '36px 32px' }}>
                    <div className="head" style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <span className="eyebrow">{p.eyebrow || 'Direct Booking'}</span>
                      <h2 style={{ margin: '6px 0 8px' }}>{p.heading || 'Schedule an Appointment'}</h2>
                      <p className="sub" style={{ margin: 0 }}>{p.subheading || 'Select your service and preferred consultation window.'}</p>
                    </div>

                    {isStepper && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent)' }}>① Consultation</span>
                        <span style={{ color: 'var(--muted)' }}>② Time Slot</span>
                        <span style={{ color: 'var(--muted)' }}>③ Confirmation</span>
                      </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); alert('Appointment requested successfully!'); }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Your Name</label>
                          <input type="text" placeholder="Full name" required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Phone / WhatsApp</label>
                          <input type="tel" placeholder="+91 98765 43210" required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        </div>
                      </div>

                      {isCalendarAppt ? (
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Select Available Date</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                            {['Thu 23', 'Fri 24', 'Sat 25', 'Mon 27', 'Tue 28'].map((day, dIdx) => (
                              <button key={day} type="button" className="studio-btn" style={{ padding: '8px 2px', fontSize: '12px', textAlign: 'center', background: dIdx === 0 ? '#f5f0eb' : '#fff' }}>
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Preferred Time Window</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {['Morning (10-1)', 'Afternoon (1-5)', 'Evening (5-8)'].map((t, idx) => (
                              <button key={t} type="button" className="studio-btn" style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', background: idx === 0 ? '#f5f0eb' : '#fff' }}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                        Request Confirmed Appointment
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            );
          }

          // 16. ACTION: LOCATION & HOURS (Variants: card, split-with-map, full-width)
          if (ci.pieceId.includes('location-hours')) {
            const isSplitMap = variant === 'split-with-map';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: isSplitMap ? '1.2fr 1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div className="card" style={{ padding: '28px' }}>
                      <span className="eyebrow">Studio Location</span>
                      <h3 style={{ margin: '6px 0 12px', fontSize: '18px', fontWeight: 700 }}>Where to Find Us</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>
                        {p.address || 'Suite 12, High Street Promenade, Indiranagar, Bangalore 560038'}
                      </p>
                      <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
                        <div><b>Phone:</b> {p.phone || '+91 (0) 80 4123 4567'}</div>
                        <div><b>Email:</b> {p.email || 'care@studiowebsite.com'}</div>
                      </div>
                    </div>

                    {isSplitMap ? (
                      <div className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '220px', background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🗺️</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Interactive Map View</span>
                          <small style={{ display: 'block', color: 'var(--muted)' }}>Indiranagar 100ft Promenade</small>
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: '28px' }}>
                        <span className="eyebrow">Operating Schedule</span>
                        <h3 style={{ margin: '6px 0 12px', fontSize: '18px', fontWeight: 700 }}>Visiting Hours</h3>
                        <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                            <span>Monday – Friday:</span> <b>09:00 AM – 08:00 PM</b>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                            <span>Saturday:</span> <b>10:00 AM – 06:00 PM</b>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <span>Sunday:</span> <span style={{ color: 'var(--accent)', fontWeight: 600 }}>By Appointment</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          // 17. ACTION: WHATSAPP CARD (Variants: card, button-row, inline)
          if (ci.pieceId.includes('whatsapp')) {
            const isButtonRow = variant === 'button-row';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ padding: '24px 0', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  {isButtonRow ? (
                    <div style={{ textAlign: 'center' }}>
                      <a href="https://wa.me" target="_blank" rel="noreferrer" className="btn" style={{ background: '#22c55e', color: '#fff', padding: '12px 28px', fontSize: '15px' }}>
                        Chat with Specialist on WhatsApp &rarr;
                      </a>
                    </div>
                  ) : (
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', flexWrap: 'wrap', gap: '16px', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                          WA
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#166534' }}>Direct WhatsApp Support</h4>
                          <small style={{ color: '#15803d' }}>Have questions? Chat directly with our specialist team. Instant replies.</small>
                        </div>
                      </div>
                      <a href="https://wa.me" target="_blank" rel="noreferrer" className="btn" style={{ background: '#22c55e', color: '#fff', margin: 0 }}>
                        Start Chat &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 18. TRUST: CASE STUDIES (Variants: cards, feature, list)
          if (ci.pieceId.includes('case-studies')) {
            const cases = [
              { client: 'Meridian Capital', outcome: '+184% Inbound Leads', title: 'Complete Brand Evolution & Platform Architecture', tag: 'FinTech Strategy' },
              { client: 'Nordic Atelier', outcome: '3.2x Conversion Rate', title: 'Minimalist D2C E-Commerce System & Brand Identity', tag: 'Luxury Living' },
              { client: 'Verve Health Labs', outcome: '42,000+ Active Users', title: 'Clinical Digital Patient Experience & Identity', tag: 'Healthcare Tech' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">{p.eyebrow || 'Selected Client Engagements'}</span>
                    <h2>{p.heading || 'Proven Outcomes & Case Studies'}</h2>
                    <p className="sub">{p.subheading || 'Deep dive into recent transformations delivered with precision and strategic rigor.'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {cases.map((c, idx) => (
                      <div key={idx} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className="badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{c.tag}</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)' }}>{c.outcome}</span>
                          </div>
                          <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>{c.title}</h4>
                          <small style={{ color: 'var(--muted)' }}>Client: <b>{c.client}</b></small>
                        </div>
                        <a href="/work" className="btn outline sm" style={{ marginTop: '20px', width: 'fit-content' }}>
                          View Case Study &rarr;
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 19. MEDIA: MARQUEE (Variants: logos, words, images)
          if (ci.pieceId.includes('marquee') || ci.pieceId.includes('client-logos')) {
            const isWords = variant === 'words';
            const wordsList = ['Precision Craft', 'Zero Compromise', 'Sustainable Provenance', 'Verified Quality', 'Timeless Finish'];
            const logos = ['Acme Corp', 'Starlight Studio', 'Kinfolk', 'Cerebral', 'Form & Function', 'Vanguard'];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ padding: '28px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  {isWords ? (
                    <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', fontWeight: 700, fontSize: '15px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {wordsList.map((w, idx) => (
                        <span key={idx} style={{ opacity: 0.85 }}>✦ {w}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '36px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.75 }}>
                      {logos.map((lg, idx) => (
                        <span key={idx} style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)' }}>
                          {lg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 20. MEDIA: PHOTO WALL (Variants: 3-across, 4-across, uneven-tiles)
          if (ci.pieceId.includes('photo-wall') || ci.pieceId.includes('gallery')) {
            const isFour = variant === '4-across';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Visual Perspectives</span>
                    <h2>Spaces &amp; Craft Gallery</h2>
                    <p className="sub">Moments captured across our recent creative collections.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isFour ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4].map((it) => (
                      <div key={it} className="card" style={{ height: '220px', background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--muted)', textAlign: 'center' }}>
                        <div>
                          <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>📷</span>
                          <small style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gallery Frame 0{it}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 21. VERTICAL: CONSULTING METHODOLOGY (Variants: steps, visual-diagram)
          if (ci.pieceId.includes('methodology') || ci.pieceId.includes('process-steps')) {
            const steps = [
              { num: '01', title: 'Diagnostic Discovery', desc: 'Comprehensive audit of business fundamentals, customer friction points, and untapped unit economics.' },
              { num: '02', title: 'Strategic Architecture', desc: 'Clear, validated roadmap prioritizing high-leverage levers with defined milestones.' },
              { num: '03', title: 'Precision Execution', desc: 'Cross-functional implementation with rapid feedback loops and rigorous quality assurance.' },
              { num: '04', title: 'Continuous Scaling', desc: 'Institutionalizing workflows, monitoring telemetry, and unlocking sustainable compounding growth.' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">Engagement Blueprint</span>
                    <h2>Our Advisory Methodology</h2>
                    <p className="sub">A proven 4-stage framework engineered to eliminate ambiguity and guarantee quantifiable results.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {steps.map((st, idx) => (
                      <div key={idx} className="card" style={{ padding: '28px 24px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent)', opacity: 0.8, marginBottom: '8px' }}>{st.num}</div>
                        <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>{st.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55 }}>{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 22. VERTICAL: RESTAURANT RESERVATION (Variants: form, widget-embedded)
          if (ci.pieceId.includes('restaurant-reservation') || ci.pieceId.includes('reservation')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  <div className="card" style={{ padding: '36px 32px' }}>
                    <div className="head" style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <span className="eyebrow">Table Bookings</span>
                      <h2>Reserve Your Dining Experience</h2>
                      <p className="sub">We accept reservations up to 30 days in advance. Walk-ins warmly welcomed at our Chef's counter.</p>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); alert('Table reserved successfully!'); }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Date</label>
                          <input type="date" defaultValue="2026-10-25" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Guests</label>
                          <select style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}>
                            <option>2 Guests (Table)</option>
                            <option>4 Guests (Dining Room)</option>
                            <option>6+ Guests (Private Dining)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Sitting</label>
                          <select style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}>
                            <option>Lunch (12:30 PM)</option>
                            <option>Early Dinner (07:00 PM)</option>
                            <option>Late Dinner (09:15 PM)</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                        Confirm Dining Reservation
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            );
          }

          // 23. VERTICAL: RESTAURANT CHEF STORY (Variants: photo-left, stacked)
          if (ci.pieceId.includes('chef-story')) {
            const isStacked = variant === 'stacked';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div style={{ display: isStacked ? 'block' : 'grid', gridTemplateColumns: isStacked ? undefined : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px', alignItems: 'center', textAlign: isStacked ? 'center' : 'left' }}>
                    <div className="card" style={{ height: isStacked ? '240px' : '320px', background: 'var(--surface)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '24px', marginBottom: isStacked ? '24px' : 0 }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍🍳</div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>Chef Tara Chandran</h4>
                      <small style={{ color: 'var(--muted)' }}>Head Culinary Director &amp; Co-Founder</small>
                    </div>
                    <div>
                      <span className="eyebrow">Culinary Philosophy</span>
                      <h2 style={{ margin: '8px 0 16px' }}>Honoring Earth, Fire &amp; Season</h2>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px', maxWidth: isStacked ? '60ch' : '100%', margin: isStacked ? '0 auto 16px' : '0 0 16px' }}>
                        We believe authentic dining begins in the soil. By partnering directly with small-batch regenerative farms within our valley, every plate respects seasonal rhythm.
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', maxWidth: isStacked ? '60ch' : '100%', margin: isStacked ? '0 auto 24px' : '0 0 24px' }}>
                        No shortcuts. Our sourdough cultures have fermented continuously for four years; our broths simmer overnight.
                      </p>
                      <a href="/menu" className="btn sm">Explore Seasonal Menu</a>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 24. VERTICAL: CLINIC PATIENT JOURNEY (Variants: timeline, numbered-steps, visual-flow)
          if (ci.pieceId.includes('patient-journey')) {
            const steps = [
              { step: '01', title: 'Consultation & 3D Imaging', desc: 'Comprehensive diagnosis using low-dose digital imaging and a relaxed conversation about your goals.' },
              { step: '02', title: 'Tailored Care Plan', desc: 'Transparent treatment options, clear timelines, and zero surprises in procedure costs.' },
              { step: '03', title: 'Gentle Treatment & Recovery', desc: 'Minimally invasive clinical execution with dedicated post-procedure follow-ups.' },
            ];

            const isNumbered = variant === 'numbered-steps';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">Care Pathways</span>
                    <h2>The Patient Experience</h2>
                    <p className="sub">We remove clinical anxiety through unhurried communication and thoughtful bedside manner.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    {steps.map((st, idx) => (
                      <div key={idx} className="card" style={{ padding: '28px', borderLeft: isNumbered ? '4px solid var(--accent)' : '1px solid var(--line)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>STEP {st.step}</span>
                        <h4 style={{ margin: '8px 0 6px', fontSize: '17px', fontWeight: 700 }}>{st.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55 }}>{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 25. VERTICAL: REAL ESTATE AMENITIES (Variants: grid, list)
          if (ci.pieceId.includes('realestate-amenities')) {
            const amenities = [
              { title: 'Private Heated Plunge Pool', desc: 'Infinity temperature-controlled pool' },
              { title: 'Dedicated 24/7 Concierge', desc: 'White-glove package & valet handling' },
              { title: 'Sub-Zero & Wolf Kitchen', desc: 'Fully integrated chef-grade appliances' },
              { title: 'Acoustic Soundproofing', desc: 'Triple-glazed imported thermal windows' },
              { title: 'Private Direct Elevator', desc: 'Biometric residence access control' },
              { title: 'EV Charging Garage', desc: 'Dedicated dual-port charging stations' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Residence Specifications</span>
                    <h2>Curated Luxury Amenities</h2>
                    <p className="sub">Every detail tailored to elevate your standard of daily living.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    {amenities.map((am, idx) => (
                      <div key={idx} className="card" style={{ padding: '24px', background: '#fff' }}>
                        <span style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 800, display: 'block', marginBottom: '8px' }}>✦</span>
                        <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>{am.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{am.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 26. ACTION: CTA BLOCK (Variants: banner, card, inline, sticky)
          if (ci.pieceId.includes('cta') && !ci.pieceId.includes('contact')) {
            const isCardCta = variant === 'card';
            const isBannerCta = variant === 'banner';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  position: 'relative',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  background: isBannerCta ? 'var(--accent)' : 'transparent',
                  color: isBannerCta ? '#fff' : 'inherit',
                  padding: isBannerCta ? '56px 0' : undefined,
                }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow">
                  {isCardCta ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 10px' }}>{p.heading || 'Ready to Begin Your Journey?'}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '46ch', margin: '0 auto 20px' }}>
                        {p.subheading || 'Take the next step with our dedicated team today.'}
                      </p>
                      <a href={p.ctaHref || '#contact'} className="btn">
                        {p.ctaLabel || 'Get Started Now'}
                      </a>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, margin: '0 0 10px' }}>
                        {p.heading || 'Take the Next Step with Us'}
                      </h2>
                      <p style={{ opacity: isBannerCta ? 0.9 : 0.8, fontSize: '15px', maxWidth: '48ch', margin: '0 auto 24px' }}>
                        {p.subheading || 'Personalized consultations crafted to meet your highest expectations.'}
                      </p>
                      <a
                        href={p.ctaHref || '#contact'}
                        className="btn"
                        style={{ background: isBannerCta ? '#fff' : undefined, color: isBannerCta ? 'var(--ink)' : undefined }}
                      >
                        {p.ctaLabel || 'Connect Today'}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 27. ACTION: CONTACT FORM (Variants: short, detailed, with-side-info, with-picker)
          if (ci.pieceId.includes('contact-form') || (ci.category === 'action' && !ci.pieceId.includes('newsletter') && !ci.pieceId.includes('appointment') && !ci.pieceId.includes('hours') && !ci.pieceId.includes('whatsapp') && !ci.pieceId.includes('reservation'))) {
            const isShort = variant === 'short';
            const isDetailed = variant === 'detailed';
            const isSideInfo = variant === 'with-side-info' || variant === 'default';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className={isSideInfo ? 'wrap' : 'wrap narrow'}>
                  <div className="head" style={{ marginBottom: '28px', textAlign: 'center' }}>
                    {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                    <h2
                      style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: '8px 0 10px' }}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                    >
                      {p.heading || 'Get in Touch'}
                    </h2>
                    <p
                      style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '48ch', margin: '0 auto' }}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                    >
                      {p.subheading || 'We look forward to connecting with you. Expect a reply within 24 hours.'}
                    </p>
                  </div>

                  {isSideInfo ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                      <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px' }}>Direct Inquiries</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
                          Our team operates Monday through Saturday. We answer all client inquiries personally.
                        </p>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                          <div><b>Email:</b> {p.email || 'contact@websitebrand.com'}</div>
                          <div><b>Phone:</b> {p.phone || '+91 (0) 80 4123 4567'}</div>
                          <div><b>Address:</b> {p.address || 'Studio 12, High Promenade, Bangalore'}</div>
                        </div>
                      </div>
                      <div className="card" style={{ padding: '32px' }}>
                        <form onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }} style={{ display: 'grid', gap: '12px' }}>
                          <input type="text" placeholder="Your Name" required style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <input type="email" placeholder="Your Email" required style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <textarea rows={3} placeholder="How can we assist you?" required style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
                          <button type="submit" className="btn sm">Send Message</button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: 'clamp(28px, 4vw, 44px)' }}>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          alert('Inquiry sent successfully!');
                        }}
                        style={{ display: 'grid', gap: '14px' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: isShort ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <input type="text" placeholder="Your Name" required style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }} />
                          <input type="email" placeholder="Email Address" required style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }} />
                        </div>
                        {isDetailed && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="tel" placeholder="Phone Number" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }} />
                            <input type="text" placeholder="Service of Interest" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }} />
                          </div>
                        )}
                        {!isShort && (
                          <textarea rows={4} placeholder="Tell us about your project or consultation request..." required style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px', resize: 'vertical' }} />
                        )}
                        <button type="submit" className="btn" style={{ justifyContent: 'center', padding: '12px 20px', fontSize: '15px' }}>
                          Send Inquiry &rarr;
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 28. FALLBACK GENERIC COMPONENT
          return (
            <section
              key={ci.instanceId}
              id={ci.instanceId}
              onClick={() => onSelectInstance?.(ci.instanceId)}
              className={`sec ${isSelected ? 'selected-section' : ''}`}
              style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
            >
              {renderActiveBadge()}
              <div className="wrap">
                <div className="head">
                  {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                  <h2
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                  >
                    {p.heading || piece?.title || ci.pieceId}
                  </h2>
                  <p
                    className="sub"
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                  >
                    {p.subheading || 'Customizable section powered by the BrandScalers library.'}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
