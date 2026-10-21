'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { CompositionManifest, ComponentInstance } from '@/lib/schemas/composition-manifest.schema';
import { DesignSystem } from '@/lib/schemas/design-system.schema';
import { ContentBlock } from '@/lib/schemas/content-block.schema';
import libraryRegistry from '@/registry/library-registry.json';

interface WebsitePreviewProps {
  manifest: CompositionManifest;
  designSystem: DesignSystem;
  contentBlocks: ContentBlock[];
  activePageSlug?: string;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  selectedInstanceId?: string | null;
  onSelectInstance?: (instanceId: string) => void;
  onNavigatePage?: (slug: string) => void;
  onSectionPropChange?: (instanceId: string, field: string, value: any) => void;
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
  isEditable = false,
}: WebsitePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePage = manifest.pages.find((p) => p.slug === activePageSlug) || manifest.pages[0];

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
                  {isCenteredLogo ? (
                    <div>
                      <a
                        href="/"
                        style={{ fontSize: '22px', fontWeight: 700, textDecoration: 'none', color: 'var(--ink)', display: 'inline-block', marginBottom: '10px' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'brandName', e)}
                      >
                        {p.brandName || 'Website Studio'}
                      </a>
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
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <a
                        href="/"
                        style={{ fontSize: '18px', fontWeight: 700, textDecoration: 'none', color: 'var(--ink)' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'brandName', e)}
                      >
                        {p.brandName || 'Website Studio'}
                      </a>

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
                  )}
                </div>
              </header>
            );
          }

          // 2. FRAME FOOTER (Variants: minimal, columns, big-cta, with-map)
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

          // 3. OPENER HERO (Variants: split, centered, with-booking, with-search, dark-overlay, banner)
          if (ci.category === 'opener' && ci.pieceId.includes('hero')) {
            const isSplit = variant === 'split' || variant === 'default';
            const isBooking = variant === 'with-booking';
            const isSearch = variant === 'with-search';
            const isDark = variant === 'dark-overlay';
            const isBanner = variant === 'banner';

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec hero ${isSelected ? 'selected-section' : ''}`}
                style={{
                  position: 'relative',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  background: isDark ? 'var(--ink)' : 'transparent',
                  color: isDark ? 'var(--bg)' : 'inherit',
                  padding: isBanner ? '40px 0' : undefined,
                }}
              >
                <div className="wrap">
                  <div
                    style={{
                      display: (isSplit || isBooking) ? 'grid' : 'block',
                      gridTemplateColumns: (isSplit || isBooking) ? '1.15fr 0.85fr' : undefined,
                      gap: '40px',
                      alignItems: 'center',
                      textAlign: variant === 'centered' ? 'center' : 'left',
                      maxWidth: variant === 'centered' ? '820px' : '100%',
                      margin: variant === 'centered' ? '0 auto' : '0',
                    }}
                  >
                    {/* Left or Main Content */}
                    <div>
                      {p.eyebrow && (
                        <span
                          className="eyebrow"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlurOrInput(ci.instanceId, 'eyebrow', e)}
                          style={{ color: isDark ? 'var(--accent)' : undefined }}
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
                          color: isDark ? '#ffffff' : undefined,
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
                          color: isDark ? 'rgba(255,255,255,0.75)' : 'var(--muted)',
                          maxWidth: (isSplit || isBooking) ? '100%' : '65ch',
                          margin: variant === 'centered' ? '0 auto 28px' : '0 0 28px',
                        }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                      >
                        {p.subheading || 'Discover authentic quality designed for modern living.'}
                      </p>

                      {/* Search Bar in Hero */}
                      {isSearch && (
                        <div style={{ maxWidth: '480px', margin: variant === 'centered' ? '0 auto 24px' : '0 0 24px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Search catalog, styles, or services..."
                            style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--btn-r, 8px)', border: '1px solid var(--line)', background: '#fff' }}
                          />
                          <button className="btn">Search</button>
                        </div>
                      )}

                      {/* CTAs */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: variant === 'centered' ? 'center' : 'flex-start' }}>
                        {p.ctaLabel && (
                          <a
                            href={p.ctaHref || '#'}
                            className="btn"
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => handleBlurOrInput(ci.instanceId, 'ctaLabel', e)}
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
                            style={{ color: isDark ? '#ffffff' : undefined, borderColor: isDark ? 'rgba(255,255,255,0.3)' : undefined }}
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
                          padding: '32px 28px',
                          borderRadius: 'var(--rad, 16px)',
                          border: '1px solid var(--line)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span className="badge" style={{ background: 'var(--accent)', color: '#fff' }}>Flagship Edition</span>
                          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>★ 4.9/5 (1.2k Reviews)</span>
                        </div>
                        <div style={{ height: '180px', borderRadius: '8px', background: 'var(--bg)', display: 'grid', placeItems: 'center', marginBottom: '16px', border: '1px dashed var(--line)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Visual Collection Preview</span>
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
                            <span>📅 Tomorrow, Oct 23</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Available</span>
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
                  </div>
                </div>
              </section>
            );
          }

          // 4. OPENER PAGE HEADER (Inner Pages)
          if (ci.category === 'opener' && ci.pieceId.includes('page-header')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: '48px 0 24px',
                  borderBottom: '1px solid var(--line)',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                <div className="wrap">
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
                    {p.subheading || activePage?.pagePurpose}
                  </p>
                </div>
              </section>
            );
          }

          // 5. OFFER: PRODUCT GRID (Variants: 2-col, 3-col, 4-col, list)
          if (ci.pieceId.includes('product-grid') || (ci.category === 'offer' && p.items && !ci.pieceId.includes('category') && !ci.pieceId.includes('feature'))) {
            const items = Array.isArray(p.items) && p.items.length > 0 ? p.items : [
              { title: 'Signature Product 1', description: 'Exceptional craftsmanship and durability.', badge: '₹1,999' },
              { title: 'Signature Product 2', description: 'Clean modern design tailored for daily use.', badge: '₹2,499' },
              { title: 'Signature Product 3', description: 'Sustainably sourced natural materials.', badge: '₹1,450' },
            ];

            const isList = variant === 'list';
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
                    /* LIST VARIANT */
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
                              {idx + 1}
                            </div>
                            <div>
                              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{item.title}</h3>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{item.description}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {item.badge && <span className="badge" style={{ fontSize: '14px', fontWeight: 700 }}>{item.badge}</span>}
                            <a href={p.ctaHref || '#'} className="btn sm">
                              {p.ctaLabel || 'Add to Bag'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* GRID VARIANT (2-col, 3-col, 4-col) */
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '20px' }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ height: '140px', background: 'var(--surface)', borderRadius: '6px', marginBottom: '14px', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                              <span>Collection Item 0{idx + 1}</span>
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

          // 6. OFFER: CATEGORY TILES
          if (ci.pieceId.includes('category-tiles')) {
            const categories = [
              { title: 'Living & Comfort', count: '14 Pieces' },
              { title: 'Kitchen & Dining', count: '9 Pieces' },
              { title: 'Bedding & Linens', count: '12 Pieces' },
              { title: 'Artisanal Ceramics', count: '8 Pieces' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">{p.eyebrow || 'Curated Lines'}</span>
                    <h2>{p.heading || 'Browse By Category'}</h2>
                    <p className="sub">{p.subheading || 'Discover specialized craft for every space.'}</p>
                  </div>
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
                </div>
              </section>
            );
          }

          // 7. OFFER: FEATURE ROWS (Alternating Story Rows)
          if (ci.pieceId.includes('feature-rows')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
                    <div>
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
                    <div style={{ height: '260px', borderRadius: 'var(--rad, 16px)', background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                      <span>Atelier Craftsmanship Spotlight</span>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 8. VERTICAL: D2C PRODUCT DETAIL SPOTLIGHT
          if (ci.pieceId.includes('product-detail')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
                    <div style={{ height: '320px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                      <span>Flagship Product Gallery</span>
                    </div>
                    <div>
                      <span className="badge" style={{ background: 'var(--accent)', color: '#fff', marginBottom: '8px' }}>Featured Spotlight</span>
                      <h2 style={{ fontSize: '28px', margin: '8px 0 8px' }}>Hand-Woven Organic Throw</h2>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>₹3,499</div>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                        Woven by master artisans from heavyweight organic fibers. Breathable, hypoallergenic, and machine-washable.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {['Natural Oat', 'Earthy Slate', 'Terracotta'].map((c, i) => (
                          <button key={c} className="studio-btn" style={{ padding: '6px 12px', fontSize: '12px', background: i === 0 ? '#f5f0eb' : '#fff' }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>Add to Bag &bull; Free Shipping</button>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 9. VERTICAL: CLINIC DOCTOR PROFILE
          if (ci.pieceId.includes('doctor-profile')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap narrow">
                  <div className="card" style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap', padding: '32px' }}>
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      DR
                    </div>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <span className="badge" style={{ marginBottom: '6px' }}>Lead Clinical Director</span>
                      <h3 style={{ margin: '4px 0 6px', fontSize: '20px', fontWeight: 700 }}>Dr. Ananya Sharma, MDS, FACS</h3>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--muted)' }}>
                        Over 14 years specializing in restorative procedures, cosmetic dentistry, and gentle patient-first care.
                      </p>
                      <small style={{ color: 'var(--accent)', fontWeight: 600 }}>★ 4.96/5 Patient Rating &bull; 4,200+ Treatments Completed</small>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 10. VERTICAL: RESTAURANT MENU
          if (ci.pieceId.includes('menu')) {
            const menuCourses = [
              { name: 'Artisan Sourdough & Herb Butter', price: '₹350', desc: 'Slow-fermented for 36 hours, served with sea-salted churned butter.' },
              { name: 'Wood-Fired Wild Mushroom Risotto', price: '₹850', desc: 'Arborio rice, porcini reduction, aged parmesan, and white truffle essence.' },
              { name: 'Dark Chocolate Ganache Tart', price: '₹450', desc: 'Valrhona single-origin chocolate with sea salt flakes and roasted hazelnut cream.' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap narrow">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Seasonal Menu</span>
                    <h2>Culinary Offerings</h2>
                    <p className="sub">Fresh local ingredients sourced from partner farms within 50 miles.</p>
                  </div>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {menuCourses.map((dish, idx) => (
                      <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', gap: '16px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{dish.name}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{dish.desc}</p>
                        </div>
                        <span className="badge" style={{ fontSize: '15px', fontWeight: 700 }}>{dish.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 11. TRUST: STATS COUNTERS (p-trust-numbers)
          if (ci.pieceId.includes('numbers')) {
            const stats = [
              { val: '10,000+', lbl: 'Happy Customers' },
              { val: '99.4%', lbl: 'Satisfaction Rate' },
              { val: '100%', lbl: 'Natural Materials' },
              { val: '24/7', lbl: 'Support Concierge' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{ padding: '36px 0', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', textAlign: 'center' }}>
                    {stats.map((s, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>{s.val}</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px', fontWeight: 500 }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 12. TRUST: TESTIMONIALS (Variants: single, carousel, grid, wall)
          if (ci.category === 'trust' || ci.pieceId.includes('testimonials')) {
            const testimonials = Array.isArray(p.testimonials) && p.testimonials.length > 0 ? p.testimonials : [
              { quote: 'Exceptional quality and honest service. Highly recommended.', author: 'Priya Verma', role: 'Verified Customer' },
              { quote: 'Meticulous attention to detail. Truly a breath of fresh air.', author: 'Devendra Sen', role: 'Client' },
            ];

            const isSingle = variant === 'single';
            const isCarousel = variant === 'carousel';
            const isGrid = variant === 'grid' || variant === 'wall';

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
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                    <h2
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                    >
                      {p.heading || 'Trusted by Our Community'}
                    </h2>
                    <p
                      className="sub"
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                    >
                      {p.subheading || 'Authentic experiences shared by verified clients.'}
                    </p>
                  </div>

                  {isSingle ? (
                    <div className="card" style={{ padding: '44px 36px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', color: 'var(--accent)', lineHeight: 0.8, marginBottom: '16px' }}>&ldquo;</div>
                      <blockquote
                        style={{ fontStyle: 'italic', fontSize: '18px', lineHeight: 1.6, margin: '0 0 20px', color: 'var(--ink)' }}
                        contentEditable={isEditable}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const nextT = [...testimonials];
                          nextT[0] = { ...nextT[0], quote: (e.target as HTMLElement).innerText };
                          onSectionPropChange?.(ci.instanceId, 'testimonials', nextT);
                        }}
                      >
                        {testimonials[0]?.quote}
                      </blockquote>
                      <cite style={{ display: 'block', fontSize: '14px', fontStyle: 'normal', fontWeight: 600 }}>
                        {testimonials[0]?.author} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>&bull; {testimonials[0]?.role}</span>
                      </cite>
                    </div>
                  ) : isCarousel ? (
                    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                      <div className="card" style={{ padding: '36px 32px' }}>
                        <blockquote
                          style={{ fontStyle: 'italic', fontSize: '16px', lineHeight: 1.6, margin: '0 0 16px', color: 'var(--ink)' }}
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const nextT = [...testimonials];
                            nextT[0] = { ...nextT[0], quote: (e.target as HTMLElement).innerText };
                            onSectionPropChange?.(ci.instanceId, 'testimonials', nextT);
                          }}
                        >
                          &ldquo;{testimonials[0]?.quote}&rdquo;
                        </blockquote>
                        <cite style={{ display: 'block', fontSize: '13px', fontStyle: 'normal', fontWeight: 600 }}>
                          {testimonials[0]?.author} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>&bull; {testimonials[0]?.role}</span>
                        </cite>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
                          <span style={{ width: '28px', height: '4px', borderRadius: '2px', background: 'var(--accent)' }} />
                          <span style={{ width: '8px', height: '4px', borderRadius: '2px', background: 'var(--line)' }} />
                          <span style={{ width: '8px', height: '4px', borderRadius: '2px', background: 'var(--line)' }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={isGrid ? 'g3' : 'g2'}>
                      {testimonials.map((t: any, idx: number) => (
                        <div key={idx} className="card">
                          <blockquote
                            style={{ fontStyle: 'italic', fontSize: '15px', lineHeight: 1.6, margin: 0, color: 'var(--ink)' }}
                            contentEditable={isEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const nextT = [...testimonials];
                              nextT[idx] = { ...nextT[idx], quote: (e.target as HTMLElement).innerText };
                              onSectionPropChange?.(ci.instanceId, 'testimonials', nextT);
                            }}
                          >
                            &ldquo;{t.quote}&rdquo;
                          </blockquote>
                          <cite style={{ display: 'block', marginTop: '16px', fontSize: '13px', fontStyle: 'normal', fontWeight: 600 }}>
                            {t.author} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>&bull; {t.role}</span>
                          </cite>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 13. ANSWER: FAQS (Variants: accordion, two-column, cards)
          if (ci.category === 'answer' || ci.pieceId.includes('faq')) {
            const faqs = Array.isArray(p.faqs) && p.faqs.length > 0 ? p.faqs : [
              { question: 'What are your delivery timelines?', answer: 'Orders are dispatched within 24 hours. Metro deliveries arrive in 2-3 business days.' },
              { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return window for unused items.' },
            ];

            const isTwoCol = variant === 'two-column';
            const isCards = variant === 'cards';

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
                <div className={isTwoCol ? 'wrap' : 'wrap narrow'}>
                  <div className="head" style={{ marginBottom: '32px' }}>
                    {p.eyebrow && <span className="eyebrow">{p.eyebrow}</span>}
                    <h2
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'heading', e)}
                    >
                      {p.heading || 'Frequently Asked Questions'}
                    </h2>
                    <p
                      className="sub"
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlurOrInput(ci.instanceId, 'subheading', e)}
                    >
                      {p.subheading || 'Everything you need to know about our workflow and standards.'}
                    </p>
                  </div>

                  {isTwoCol ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                      {faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '24px' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>{faq.question}</h4>
                          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6 }}>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : isCards ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '24px' }}>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--accent)', marginBottom: '6px' }}>Q: {faq.question}</div>
                          <p style={{ margin: 0, color: 'var(--ink)', fontSize: '14px', lineHeight: 1.6 }}>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {faqs.map((faq: any, idx: number) => (
                        <details key={idx} className="card" open={idx === 0} style={{ cursor: 'pointer' }}>
                          <summary style={{ fontWeight: 600, fontSize: '15px', display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span>{faq.question}</span>
                            <span style={{ color: 'var(--accent)' }}>+</span>
                          </summary>
                          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.55 }}>
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 14. ACTION: NEWSLETTER SIGNUP (Variants: inline, banner, footer, popup)
          if (ci.pieceId.includes('newsletter')) {
            const isInline = variant === 'inline';
            const isBannerVariant = variant === 'banner' || variant === 'default';
            const isFooterVariant = variant === 'footer';
            const isPopupVariant = variant === 'popup';

            if (isInline) {
              return (
                <section
                  key={ci.instanceId}
                  id={ci.instanceId}
                  onClick={() => onSelectInstance?.(ci.instanceId)}
                  className={`sec ${isSelected ? 'selected-section' : ''}`}
                  style={{
                    padding: '24px 0',
                    borderTop: '1px solid var(--line)',
                    borderBottom: '1px solid var(--line)',
                    position: 'relative',
                    cursor: isEditable ? 'pointer' : 'default',
                    outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  }}
                >
                  {renderActiveBadge()}
                  <div className="wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700 }}>
                          {p.heading || 'Join Our Private Newsletter'}
                        </h4>
                        <small style={{ color: 'var(--muted)' }}>Receive seasonal invitations &amp; member privileges.</small>
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} style={{ display: 'flex', gap: '8px', minWidth: '300px' }}>
                        <input type="email" placeholder="Your email address" required style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', fontSize: '13px' }} />
                        <button type="submit" className="btn sm">Join</button>
                      </form>
                    </div>
                  </div>
                </section>
              );
            }

            if (isPopupVariant) {
              return (
                <section
                  key={ci.instanceId}
                  id={ci.instanceId}
                  onClick={() => onSelectInstance?.(ci.instanceId)}
                  className={`sec ${isSelected ? 'selected-section' : ''}`}
                  style={{
                    padding: '40px 0',
                    position: 'relative',
                    cursor: isEditable ? 'pointer' : 'default',
                    outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  }}
                >
                  {renderActiveBadge()}
                  <div className="wrap narrow">
                    <div
                      className="card"
                      style={{
                        padding: '36px 32px',
                        textAlign: 'center',
                        border: '2px solid var(--accent)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                        position: 'relative',
                      }}
                    >
                      <span className="badge" style={{ background: 'var(--accent)', color: '#fff', marginBottom: '12px' }}>
                        ★ Exclusive First-Order VIP Pass
                      </span>
                      <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0' }}>
                        {p.heading || 'Unlock 15% Off Your First Purchase'}
                      </h3>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '44ch', margin: '0 auto 16px' }}>
                        Use code <b style={{ color: 'var(--ink)' }}>STUDIO15</b> at checkout. Join our community for early access.
                      </p>
                      <form onSubmit={(e) => { e.preventDefault(); alert('Discount coupon claimed!'); }} style={{ display: 'flex', gap: '8px', maxWidth: '380px', margin: '0 auto' }}>
                        <input type="email" placeholder="Enter your email" required style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', fontSize: '14px' }} />
                        <button type="submit" className="btn">Claim 15% Off</button>
                      </form>
                    </div>
                  </div>
                </section>
              );
            }

            if (isFooterVariant) {
              return (
                <section
                  key={ci.instanceId}
                  id={ci.instanceId}
                  onClick={() => onSelectInstance?.(ci.instanceId)}
                  className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                  style={{
                    padding: '36px 0',
                    position: 'relative',
                    cursor: isEditable ? 'pointer' : 'default',
                    outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  }}
                >
                  {renderActiveBadge()}
                  <div className="wrap narrow">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>{p.heading || 'Stay in the Circle'}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px' }}>Zero spam. Only intentional releases and quiet stories.</p>
                      <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }} style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
                        <input type="email" placeholder="Email address" required style={{ flex: 1, padding: '10px 14px', borderRadius: '999px', border: '1px solid var(--line)', fontSize: '13px' }} />
                        <button type="submit" className="btn sm" style={{ borderRadius: '999px' }}>Subscribe</button>
                      </form>
                    </div>
                  </div>
                </section>
              );
            }

            // Default: BANNER VARIANT
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{
                  background: 'var(--accent)',
                  color: '#ffffff',
                  padding: '48px 0',
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid #ffffff' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap narrow" style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, opacity: 0.9 }}>
                    Community &bull; New Release Access
                  </span>
                  <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', margin: '8px 0 12px', color: '#ffffff' }}>
                    {p.heading || 'Enjoy 15% Off Your Next Order'}
                  </h2>
                  <p style={{ opacity: 0.85, fontSize: '15px', maxWidth: '48ch', margin: '0 auto 24px' }}>
                    {p.subheading || 'Subscribe to receive private updates, seasonal release notes, and member privileges.'}
                  </p>
                  <form
                    onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}
                    style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto', flexWrap: 'wrap' }}
                  >
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      required
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '0',
                        borderRadius: 'var(--btn-r, 8px)',
                        background: '#ffffff',
                        color: '#1a1a1c',
                        fontSize: '14px',
                      }}
                    />
                    <button type="submit" className="btn" style={{ background: '#1a1a1c', color: '#ffffff', margin: 0 }}>
                      Join Community
                    </button>
                  </form>
                </div>
              </section>
            );
          }

          // 15. ACTION: APPOINTMENT REQUEST / BOOKING
          if (ci.pieceId.includes('appointment')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap narrow">
                  <div className="card" style={{ padding: '36px 32px' }}>
                    <div className="head" style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <span className="eyebrow">{p.eyebrow || 'Direct Booking'}</span>
                      <h2 style={{ margin: '6px 0 8px' }}>{p.heading || 'Schedule an Appointment'}</h2>
                      <p className="sub" style={{ margin: 0 }}>{p.subheading || 'Select your service and preferred consultation window.'}</p>
                    </div>
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
                      <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                        Request Confirmed Appointment
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            );
          }

          // 16. ACTION: LOCATION & HOURS
          if (ci.pieceId.includes('location-hours')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
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
                          <span>Sunday:</span> <span style={{ color: 'var(--accent)', fontWeight: 600 }}>By Appointment Only</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 17. ACTION: WHATSAPP CARD
          if (ci.pieceId.includes('whatsapp')) {
            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec ${isSelected ? 'selected-section' : ''}`}
                style={{ padding: '24px 0', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
              >
                <div className="wrap narrow">
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
                </div>
              </section>
            );
          }

          // 17.5. TRUST: CASE STUDIES (Agency / Studio / Consulting)
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
                style={{
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
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
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{c.outcome}</span>
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>{c.title}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                            Partnered with {c.client} to engineer a purpose-driven digital standard that elevated market positioning and measurable growth.
                          </p>
                        </div>
                        <a href="/contact" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                          View Case Study &rarr;
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.6. MEDIA: MARQUEE / CLIENT LOGOS
          if (ci.pieceId.includes('marquee') || ci.pieceId.includes('client-logos')) {
            const partners = ['AURA LABS', 'VERVE STUDIO', 'NORDIC CO.', 'MERIDIAN', 'ECHELON ARCHITECTURE', 'TERRA FLORA'];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: '28px 0',
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                  borderTop: '1px solid var(--line)',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <small style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 600 }}>
                      Trusted by Leading Brands &amp; Pioneers Worldwide
                    </small>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px', opacity: 0.75 }}>
                    {partners.map((pt, i) => (
                      <span key={i} style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.14em', fontFamily: 'var(--font-head)' }}>
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.7. VERTICAL: FITNESS CLASS SCHEDULE
          if (ci.pieceId.includes('fitness-class-schedule')) {
            const schedule = [
              { time: '07:00 AM', name: 'Sunrise Vinyasa Flow', coach: 'Elena Rostova', level: 'All Levels', room: 'Sanctuary A' },
              { time: '09:30 AM', name: 'Core Reformer & Sculpt', coach: 'Marcus Vance', level: 'Intermediate', room: 'Reformer Studio' },
              { time: '12:00 PM', name: 'Functional Mobility & Breathwork', coach: 'Dr. Siddharth Rao', level: 'Beginner Friendly', room: 'Zen Garden' },
              { time: '06:00 PM', name: 'High-Intensity Athletic Conditioning', coach: 'Aria Chen', level: 'Advanced', room: 'Performance Hub' },
            ];

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
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Weekly Movement Timetable</span>
                    <h2>Class Schedule &amp; Bookings</h2>
                    <p className="sub">Small-group sessions guided by master practitioners in our climate-balanced studios.</p>
                  </div>
                  <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 1fr 100px', padding: '12px 20px', background: 'var(--surface)', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid var(--line)' }}>
                      <span>TIME</span>
                      <span>SESSION</span>
                      <span>INSTRUCTOR</span>
                      <span>INTENSITY</span>
                      <span style={{ textAlign: 'right' }}>ACTION</span>
                    </div>
                    {schedule.map((s, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 1fr 100px', padding: '16px 20px', alignItems: 'center', borderBottom: idx < schedule.length - 1 ? '1px solid var(--line)' : 'none', fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.time}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <small style={{ color: 'var(--muted)' }}>{s.room}</small>
                        </div>
                        <span>{s.coach}</span>
                        <span className="badge" style={{ width: 'fit-content', fontSize: '11px' }}>{s.level}</span>
                        <div style={{ textAlign: 'right' }}>
                          <button onClick={() => alert(`Reserved spot for ${s.name}`)} className="btn sm">Reserve</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.8. VERTICAL: FITNESS MEMBERSHIP
          if (ci.pieceId.includes('fitness-membership')) {
            const tiers = [
              { name: 'Studio Flex', price: '₹4,500', period: '/ month', desc: '8 sessions per month with full locker and steam privileges.', features: ['8 Studio Classes', 'Mat & Towel Service', 'Online Booking Window 7 Days Ahead', 'Locker Room & Herbal Tea Bar'] },
              { name: 'Unlimited Sanctuary', price: '₹8,500', period: '/ month', desc: 'Unlimited access to all movement classes, workshops, and private suites.', features: ['Unlimited Classes', 'Dedicated Concierge', 'Priority 14-Day Advance Booking', '2 Guest Passes per Month', 'Monthly Private Mobility Check-in'], popular: true },
              { name: 'Private Patron', price: '₹18,000', period: '/ month', desc: 'Bespoke 1-on-1 athletic coaching and personalized nutrition protocols.', features: ['8 Private 1-on-1 Sessions', 'Unlimited Studio Classes', 'Full Wellness Diagnostic', 'Customized Movement Protocol', '24/7 Coach Direct Channel'] },
            ];

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
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">Membership Tiers</span>
                    <h2>Invest in Your Well-Being</h2>
                    <p className="sub">Transparent, contract-free memberships designed around mindful consistency.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {tiers.map((tr, idx) => (
                      <div key={idx} className="card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: tr.popular ? '2px solid var(--accent)' : '1px solid var(--line)', position: 'relative' }}>
                        {tr.popular && (
                          <span style={{ position: 'absolute', top: '-11px', left: '24px', background: 'var(--accent)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', textTransform: 'uppercase' }}>
                            Most Popular
                          </span>
                        )}
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>{tr.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '12px 0 16px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)' }}>{tr.price}</span>
                            <small style={{ color: 'var(--muted)' }}>{tr.period}</small>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>{tr.desc}</p>
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'grid', gap: '10px', fontSize: '13px' }}>
                            {tr.features.map((f, i) => (
                              <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button onClick={() => alert(`Selected ${tr.name}`)} className={tr.popular ? 'btn' : 'studio-btn'} style={{ width: '100%', justifyContent: 'center' }}>
                          Select {tr.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.9. VERTICAL: REAL ESTATE LISTINGS
          if (ci.pieceId.includes('realestate-listing-card') || ci.pieceId.includes('properties')) {
            const listings = [
              { title: 'The Terrace Atelier Residence', price: '₹4.25 Cr', beds: '3 Beds', baths: '3.5 Baths', sqft: '2,850 sq.ft', location: 'Indiranagar 100ft Promenade', badge: 'New Exclusive' },
              { title: 'Pavilion Penthouse with Private Plunge Pool', price: '₹7.80 Cr', beds: '4 Beds', baths: '5 Baths', sqft: '4,600 sq.ft', location: 'Koramangala 3rd Block', badge: 'Under Offer' },
              { title: 'Forest Edge Courtyard Villa', price: '₹9.50 Cr', beds: '5 Beds', baths: '6 Baths', sqft: '6,200 sq.ft', location: 'Whitefield Boulevard', badge: 'Handover Ready' },
            ];

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
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">Prime Architectural Inventory</span>
                    <h2>Featured Properties &amp; Residences</h2>
                    <p className="sub">Curated residential developments engineered with natural stone, floor-to-ceiling glass, and serene gardens.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {listings.map((l, idx) => (
                      <div key={idx} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '180px', background: 'var(--surface)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>Architectural Visualization</span>
                          <span className="badge" style={{ position: 'absolute', top: '12px', right: '12px' }}>{l.badge}</span>
                        </div>
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', marginBottom: '4px' }}>{l.price}</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>{l.title}</h3>
                            <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '16px' }}>📍 {l.location}</small>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--ink)', padding: '10px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: '20px' }}>
                              <span>🛏️ {l.beds}</span>
                              <span>🚿 {l.baths}</span>
                              <span>📐 {l.sqft}</span>
                            </div>
                          </div>
                          <a href="/contact" className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>
                            Schedule Private Viewing
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.10. VERTICAL: REAL ESTATE AMENITIES
          if (ci.pieceId.includes('realestate-amenities')) {
            const amenities = [
              { icon: '🌿', title: 'Private Zen Courtyard', desc: 'Acoustically shielded indigenous gardens with cascading water features.' },
              { icon: '⚡', title: 'Tesla & EV Superchargers', desc: 'Dedicated 22kW bidirectional fast-charging station for every penthouse.' },
              { icon: '🛡️', title: 'Biometric Access & Concierge', desc: 'Discreet 24/7 security protocol and white-glove valet management.' },
              { icon: '🍷', title: 'Sommelier Wine Vault', desc: 'Temperature & humidity precision storage with private cellar lockers.' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: '48px 0',
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow">Estate Features</span>
                    <h2>Engineered for Discerning Living</h2>
                    <p className="sub">Every residential amenity is conceived as an enduring extension of refined domestic comfort.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {amenities.map((a, idx) => (
                      <div key={idx} className="card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '12px' }}>{a.icon}</div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{a.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 17.11. VERTICAL: CONSULTING METHODOLOGY
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
                style={{
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
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

          // 17.12. VERTICAL: RESTAURANT RESERVATION
          if (ci.pieceId.includes('restaurant-reservation') || ci.pieceId.includes('reservation')) {
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
                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Special Dietary Notes</label>
                        <input type="text" placeholder="Allergies, anniversaries, or seating preferences" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }} />
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

          // 17.13. VERTICAL: RESTAURANT CHEF STORY
          if (ci.pieceId.includes('chef-story')) {
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
                <div className="wrap">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px', alignItems: 'center' }}>
                    <div className="card" style={{ height: '320px', background: 'var(--surface)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '24px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍🍳</div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>Chef Tara Chandran</h4>
                      <small style={{ color: 'var(--muted)' }}>Head Culinary Director &amp; Co-Founder</small>
                    </div>
                    <div>
                      <span className="eyebrow">Culinary Philosophy</span>
                      <h2 style={{ margin: '8px 0 16px' }}>Honoring Earth, Fire &amp; Season</h2>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
                        We believe authentic dining begins in the soil. By partnering directly with small-batch regenerative farms within our valley, every plate respects seasonal rhythm.
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                        No shortcuts. Our sourdough cultures have fermented continuously for four years; our broths simmer overnight.
                      </p>
                      <a href="/menu" className="btn sm">Explore Seasonal Menu</a>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 17.14. VERTICAL: CLINIC PATIENT JOURNEY
          if (ci.pieceId.includes('patient-journey')) {
            const steps = [
              { step: '01', title: 'Consultation & 3D Imaging', desc: 'Comprehensive diagnosis using low-dose digital imaging and a relaxed conversation about your goals.' },
              { step: '02', title: 'Tailored Care Plan', desc: 'Transparent treatment options, clear timelines, and zero surprises in procedure costs.' },
              { step: '03', title: 'Gentle Treatment & Recovery', desc: 'Minimally invasive clinical execution with dedicated post-procedure follow-ups.' },
            ];

            return (
              <section
                key={ci.instanceId}
                id={ci.instanceId}
                onClick={() => onSelectInstance?.(ci.instanceId)}
                className={`sec surface ${isSelected ? 'selected-section' : ''}`}
                style={{
                  padding: '48px 0',
                  position: 'relative',
                  cursor: isEditable ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none',
                }}
              >
                {renderActiveBadge()}
                <div className="wrap">
                  <div className="head" style={{ marginBottom: '36px' }}>
                    <span className="eyebrow">Patient Experience</span>
                    <h2>Your Pathway to Lasting Care</h2>
                    <p className="sub">We remove clinical anxiety through unhurried communication and thoughtful bedside manner.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    {steps.map((st, idx) => (
                      <div key={idx} className="card" style={{ padding: '28px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>PHASE {st.step}</span>
                        <h4 style={{ margin: '8px 0 6px', fontSize: '17px', fontWeight: 700 }}>{st.title}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55 }}>{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 18. ACTION: CONTACT FORM (Variants: short, with-side-info, detailed)
          if (ci.pieceId.includes('contact-form') || ci.category === 'action') {
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Your Name"
                            required
                            style={{ padding: '12px 14px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '14px' }}
                          />
                          <input
                            type="email"
                            placeholder="Your Email"
                            required
                            style={{ padding: '12px 14px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '14px' }}
                          />
                        </div>
                        {isDetailed && (
                          <input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            style={{ padding: '12px 14px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '14px' }}
                          />
                        )}
                        <textarea
                          rows={isShort ? 3 : 5}
                          placeholder="How can we assist you?"
                          required
                          style={{ padding: '12px 14px', borderRadius: 'var(--btn-r, 6px)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '14px', resize: 'vertical' }}
                        />
                        <button type="submit" className="btn" style={{ justifyContent: 'center' }}>
                          {p.ctaLabel || 'Send Message'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 19. FALLBACK GENERIC COMPONENT
          return (
            <section
              key={ci.instanceId}
              id={ci.instanceId}
              onClick={() => onSelectInstance?.(ci.instanceId)}
              className={`sec ${isSelected ? 'selected-section' : ''}`}
              style={{ position: 'relative', outline: isSelected ? '2px solid var(--accent, #8c593b)' : 'none' }}
            >
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
