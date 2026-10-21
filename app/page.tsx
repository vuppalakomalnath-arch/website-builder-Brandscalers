import Link from 'next/link';
import { ArrowRight, Sparkles, Layers, Sliders, ShieldCheck, CheckCircle2 } from 'lucide-react';
import libraryRegistry from '@/registry/library-registry.json';

export default function HomePage() {
  const totalPieces = (libraryRegistry as any).totalPieces || 98;
  const totalLooks = (libraryRegistry as any).totalLooks || 292;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--studio-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Studio Header */}
      <header className="studio-navbar">
        <Link href="/" className="studio-logo">
          <span>W</span> Website Studio
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="cost-telemetry-chip">
            <Sparkles size={14} /> AI Budget: ≤ ₹8.00 / generation
          </div>
          <Link href="/new" className="studio-btn primary">
            Create New Website <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '960px', margin: '64px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: '#f0eee8', fontSize: '13px', fontWeight: 600, color: 'var(--studio-accent)', marginBottom: '20px' }}>
          <Sparkles size={14} /> Powered by Google Gemini &amp; BrandScalers Library
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
          Structured Website Engine with an Interactive Visual Editor
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--studio-muted)', maxWidth: '64ch', margin: '0 auto 36px', lineHeight: 1.55 }}>
          Not a raw prompt box. Website Studio turns three basic inputs into a fully responsive, distinctive website
          composed from <b>{totalPieces} design pieces and {totalLooks} validated looks</b>—with deep visual editing and a measured AI cost under ₹8.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '64px' }}>
          <Link href="/new" className="studio-btn primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Generate New Website <ArrowRight size={18} />
          </Link>
          <a href="#library-breakdown" className="studio-btn" style={{ padding: '14px 24px', fontSize: '16px' }}>
            Explore {totalPieces} Pieces &amp; {totalLooks} Looks
          </a>
        </div>

        {/* 3 Pillar Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left', marginBottom: '64px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid var(--studio-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f5f0eb', color: 'var(--studio-accent)', display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
              <Layers size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Full BrandScalers Library</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--studio-muted)', lineHeight: 1.5 }}>
              All {totalPieces} pieces and {totalLooks} looks verified and available. Composed without unvetted boilerplate.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid var(--studio-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f5f0eb', color: 'var(--studio-accent)', display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
              <Sliders size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>16 Design Dials &amp; Visual Editing</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--studio-muted)', lineHeight: 1.5 }}>
              Directly manipulate typography, colors, layouts, and variants. Zero Gemini calls for routine edits.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid var(--studio-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0fdf4', color: '#166534', display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>≤ ₹8 AI Generation Cost</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--studio-muted)', lineHeight: 1.5 }}>
              Real-time token and INR cost accounting ledger verified against our hard budget ceiling.
            </p>
          </div>
        </div>

        {/* Library Inventory Breakdown Section */}
        <section id="library-breakdown" style={{ textAlign: 'left', background: '#ffffff', borderRadius: '12px', padding: '36px 32px', border: '1px solid var(--studio-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--studio-accent)' }}>
                Source Ingestion Audit
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '4px 0 0' }}>BrandScalers Component Patterns (98 Pieces / 292 Looks)</h2>
            </div>
            <div className="cost-telemetry-chip">
              <CheckCircle2 size={14} /> 100% Validated
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {[
              { cat: 'Frame Patterns', count: '12 pieces (38 looks)', desc: 'Headers, footers, announcement bars, mobile menus, modals' },
              { cat: 'Opener / Hero Patterns', count: '2 pieces (13 looks)', desc: 'Split, centered, dark overlay, booking hero, search hero' },
              { cat: 'Offer Patterns', count: '14 pieces (47 looks)', desc: 'Services grids, feature rows, pricing tables, category menus' },
              { cat: 'Trust & Credibility Patterns', count: '8 pieces (27 looks)', desc: 'Testimonials carousel, case studies, stats counters, badges' },
              { cat: 'Media & Gallery Patterns', count: '9 pieces (28 looks)', desc: 'Masonry galleries, photo walls, marquee logos, interactive maps' },
              { cat: 'Answer & FAQ Patterns', count: '2 pieces (7 looks)', desc: 'Accordions, two-column QA, step explainers' },
              { cat: 'Action & Conversion Patterns', count: '11 pieces (33 looks)', desc: 'Appointment steppers, contact forms, WhatsApp cards, newsletters' },
              { cat: 'Editorial Content Patterns', count: '5 pieces (14 looks)', desc: 'Blog indices, article templates, text blocks, quote cards' },
              { cat: 'Motion Patterns', count: '8 pieces (18 looks)', desc: 'Scroll reveals, 3D tilt, counter up, CSS lottie vector loops' },
              { cat: 'Vertical Industry Patterns', count: '27 pieces (67 looks)', desc: 'Clinics, dining, D2C, education, real estate, beauty, fitness' },
            ].map((item) => (
              <div key={item.cat} style={{ padding: '14px', background: '#faf9f6', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  <span>{item.cat}</span>
                  <span style={{ color: 'var(--studio-accent)' }}>{item.count}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
