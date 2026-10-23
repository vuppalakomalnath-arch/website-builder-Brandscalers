'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, Compass, HelpCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  // Form State: 3 Required + 2 Optional Inputs
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [offeringsAndGoals, setOfferingsAndGoals] = useState('');
  const [websiteOrDemoUrl, setWebsiteOrDemoUrl] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  // Generation Workflow State
  const [step, setStep] = useState<'brief' | 'clarify' | 'plan_review' | 'generating'>('brief');
  const [inferredProfile, setInferredProfile] = useState<any>(null);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<any[]>([]);
  const [suggestedBenchmarks, setSuggestedBenchmarks] = useState<{ recommended: any; alternatives: any[] } | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentStage, setCurrentStage] = useState<string>('brief_received');
  const [costTelemetry, setCostTelemetry] = useState<{ tokens: number; costINR: number }>({ tokens: 0, costINR: 0 });
  const [error, setError] = useState<string | null>(null);

  // 1. Submit Brief to Inference Engine
  const handleInferBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !offeringsAndGoals.trim()) {
      setError('Please provide your business name and a short description of what you offer.');
      return;
    }
    setError(null);

    try {
      const res = await fetch('/api/onboarding/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessCategory: businessCategory || "I'm not sure",
          offeringsAndGoals,
          websiteOrDemoUrl,
          referenceUrl,
          selectedBenchmarkId: selectedBenchmark?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to infer profile.');

      setInferredProfile(data.profile);
      setAdaptiveQuestions(data.questions || []);
      if (data.suggestedBenchmarks) {
        setSuggestedBenchmarks(data.suggestedBenchmarks);
        if (!referenceUrl && data.suggestedBenchmarks.recommended) {
          setSelectedBenchmark(data.suggestedBenchmarks.recommended);
        }
      }

      if (data.questions && data.questions.length > 0) {
        setStep('clarify');
      } else {
        setStep('plan_review');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with inference engine.');
    }
  };

  // 2. Start Full Generation Run
  const handleStartGeneration = async () => {
    setStep('generating');
    setCurrentStage('profile_ready');
    setError(null);

    try {
      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: {
            businessName,
            businessCategory: businessCategory || inferredProfile?.businessCategory,
            offeringsAndGoals: `${offeringsAndGoals} ${Object.values(selectedAnswers).join('. ')}`,
            websiteOrDemoUrl,
            referenceUrl: referenceUrl || selectedBenchmark?.url,
            selectedBenchmarkId: selectedBenchmark?.id,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation pipeline failed.');

      setCostTelemetry({
        tokens: (data.inputTokens || 0) + (data.outputTokens || 0),
        costINR: data.estimatedAiCostINR || 0,
      });

      // Save to localStorage for instant editor loading
      localStorage.setItem(`ws_project_${data.projectId}`, JSON.stringify(data));

      // Transition to visual editor
      router.push(`/editor/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || 'Generation error occurred.');
      setStep('plan_review');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--studio-bg)' }}>
      {/* Studio Header */}
      <header className="studio-navbar">
        <Link href="/" className="studio-logo">
          <span>W</span> Website Studio
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="cost-telemetry-chip">
            <Sparkles size={14} /> AI Budget: ≤ ₹8.00 / site
          </div>
          <Link href="/projects" className="studio-btn">
            My Projects
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '780px', margin: '48px auto', padding: '0 24px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              marginBottom: '24px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Interactive Step Stepper & Back Navigation */}
        {step !== 'generating' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '10px 16px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid var(--studio-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStep('brief')}
                style={{
                  border: 0,
                  background: step === 'brief' ? '#f5f0eb' : 'transparent',
                  color: step === 'brief' ? 'var(--studio-accent)' : 'var(--studio-ink)',
                  fontWeight: step === 'brief' ? 700 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: step === 'brief' ? 'var(--studio-accent)' : '#e5e2dc', color: step === 'brief' ? '#fff' : '#666', fontSize: '11px', display: 'grid', placeItems: 'center', fontWeight: 700 }}>1</span>
                Business Brief
              </button>

              <span style={{ color: 'var(--studio-border)' }}>&rarr;</span>

              <button
                type="button"
                onClick={() => {
                  if (inferredProfile) setStep('clarify');
                }}
                disabled={!inferredProfile}
                style={{
                  border: 0,
                  background: step === 'clarify' ? '#f5f0eb' : 'transparent',
                  color: step === 'clarify' ? 'var(--studio-accent)' : !inferredProfile ? '#aaa' : 'var(--studio-ink)',
                  fontWeight: step === 'clarify' ? 700 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: inferredProfile ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: step === 'clarify' ? 'var(--studio-accent)' : '#e5e2dc', color: step === 'clarify' ? '#fff' : '#666', fontSize: '11px', display: 'grid', placeItems: 'center', fontWeight: 700 }}>2</span>
                Clarification
              </button>

              <span style={{ color: 'var(--studio-border)' }}>&rarr;</span>

              <button
                type="button"
                onClick={() => {
                  if (inferredProfile) setStep('plan_review');
                }}
                disabled={!inferredProfile}
                style={{
                  border: 0,
                  background: step === 'plan_review' ? '#f5f0eb' : 'transparent',
                  color: step === 'plan_review' ? 'var(--studio-accent)' : !inferredProfile ? '#aaa' : 'var(--studio-ink)',
                  fontWeight: step === 'plan_review' ? 700 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: inferredProfile ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: step === 'plan_review' ? 'var(--studio-accent)' : '#e5e2dc', color: step === 'plan_review' ? '#fff' : '#666', fontSize: '11px', display: 'grid', placeItems: 'center', fontWeight: 700 }}>3</span>
                Site Architecture
              </button>
            </div>

            {step !== 'brief' && (
              <button
                type="button"
                onClick={() => {
                  if (step === 'plan_review') {
                    setStep(adaptiveQuestions.length > 0 ? 'clarify' : 'brief');
                  } else if (step === 'clarify') {
                    setStep('brief');
                  }
                }}
                className="studio-btn"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            )}
          </div>
        )}

        {/* STEP 1: Minimal 3-Input Onboarding */}
        {step === 'brief' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--studio-border)',
              padding: '36px 32px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '28px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--studio-accent)',
                }}
              >
                Requirement R1 &bull; Minimal Input
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '6px 0 10px', color: 'var(--studio-ink)' }}>
                Tell us about your business
              </h1>
              <p style={{ margin: 0, color: 'var(--studio-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                Three simple questions. Website Studio automatically infers your visitor journeys, generates a custom
                design system from 98 verified BrandScalers components, and generates tailored content.
              </p>
            </div>

            <form onSubmit={handleInferBrief}>
              {/* Input 1 */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                  1. Business or Brand Name <span style={{ color: 'var(--studio-accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lumina Dental Care, Studio Kanso, GreenRoot Kitchen"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--studio-border)',
                    background: '#faf9f6',
                  }}
                />
              </div>

              {/* Input 2 */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                  2. Business Category or Field <span style={{ color: 'var(--studio-accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dental Clinic, Organic Restaurant, Architecture Studio, or 'I am not sure'"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--studio-border)',
                    background: '#faf9f6',
                  }}
                />
              </div>

              {/* Input 3 */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                  3. What do you offer, and what should the website achieve? <span style={{ color: 'var(--studio-accent)' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your primary services/products and how you want visitors to take action (e.g. 'We provide preventative dentistry and cosmetic veneers for families. We want patients to book appointments directly online.')."
                  value={offeringsAndGoals}
                  onChange={(e) => setOfferingsAndGoals(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--studio-border)',
                    background: '#faf9f6',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Optional Links */}
              <div style={{ padding: '16px', background: '#faf9f6', borderRadius: '8px', marginBottom: '28px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--studio-muted)' }}>
                  Optional References
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <input
                    type="url"
                    placeholder="Existing website or demo URL"
                    value={websiteOrDemoUrl}
                    onChange={(e) => setWebsiteOrDemoUrl(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--studio-border)',
                      background: '#fff',
                    }}
                  />
                  <input
                    type="url"
                    placeholder="Inspirational reference website"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--studio-border)',
                      background: '#fff',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="studio-btn primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '16px' }}
              >
                Analyze Brief & Propose Plan <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Adaptive Clarification (Max 1 High-Impact Q) */}
        {step === 'clarify' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--studio-border)',
              padding: '36px 32px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--studio-accent)',
              }}
            >
              Adaptive Clarification
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 14px' }}>
              {adaptiveQuestions[0]?.question}
            </h2>
            <p style={{ color: 'var(--studio-muted)', fontSize: '14px', marginBottom: '20px' }}>
              {adaptiveQuestions[0]?.reason}
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
              {adaptiveQuestions[0]?.options?.map((opt: string) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({ [adaptiveQuestions[0].id]: opt });
                    setStep('plan_review');
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--studio-border)',
                    background: selectedAnswers[adaptiveQuestions[0].id] === opt ? '#f5f0eb' : '#faf9f6',
                    color: 'var(--studio-ink)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setStep('brief')}
                className="studio-btn"
                style={{ padding: '12px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Brief
              </button>
              <button
                type="button"
                onClick={() => setStep('plan_review')}
                className="studio-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Skip / Use Recommended Default
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Plan Review */}
        {step === 'plan_review' && inferredProfile && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--studio-border)',
              padding: '36px 32px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--studio-accent)',
              }}
            >
              Business Understanding & Site Plan
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 16px' }}>
              Planned Architecture for {inferredProfile.businessName}
            </h2>

            {/* Profile Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              <div style={{ padding: '14px', background: '#faf9f6', borderRadius: '8px' }}>
                <small style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Category</small>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>{inferredProfile.businessCategory}</div>
              </div>
              <div style={{ padding: '14px', background: '#faf9f6', borderRadius: '8px' }}>
                <small style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Recommended Tone</small>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>{inferredProfile.brandTone}</div>
              </div>
              <div style={{ padding: '14px', background: '#faf9f6', borderRadius: '8px' }}>
                <small style={{ color: 'var(--studio-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Primary Conversion</small>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>{inferredProfile.primaryConversion.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Planned Pages */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Sitemap & Essential Pages:</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {inferredProfile.requiredPages.map((page: string) => (
                  <span
                    key={page}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: '#f0eee8',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    /{page}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested Benchmark Reference Websites */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                  Reference Website &amp; Design Blueprint
                </h3>
                {referenceUrl ? (
                  <span style={{ fontSize: '12px', color: 'var(--studio-accent)', fontWeight: 600 }}>
                    Custom Reference Provided: {referenceUrl}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                    Select an inspirational benchmark to adapt layout &amp; design
                  </span>
                )}
              </div>

              {!referenceUrl && (
                <div style={{ padding: '12px 14px', background: '#f5f0eb', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--studio-ink)', lineHeight: 1.5 }}>
                  💡 <b>No reference link was provided.</b> We analyzed top benchmarks for <b>{inferredProfile.businessCategory}</b>.
                  Select a reference below to apply its component placement, typography, and proven conversion architecture:
                </div>
              )}

              {suggestedBenchmarks && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {[suggestedBenchmarks.recommended, ...suggestedBenchmarks.alternatives.slice(0, 3)].map((bm: any) => {
                    const isPicked = selectedBenchmark?.id === bm.id;
                    const isRec = suggestedBenchmarks.recommended.id === bm.id;

                    return (
                      <div
                        key={bm.id}
                        onClick={() => {
                          setSelectedBenchmark(bm);
                          setInferredProfile((prev: any) => ({
                            ...prev,
                            brandTone: bm.aestheticTone,
                          }));
                        }}
                        style={{
                          padding: '18px',
                          borderRadius: '10px',
                          border: isPicked ? '2px solid var(--studio-accent)' : '1px solid var(--studio-border)',
                          background: isPicked ? '#fcfbf9' : '#fff',
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isPicked ? '0 4px 14px rgba(140, 89, 59, 0.12)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>{bm.name}</span>
                            {isRec && (
                              <span style={{ background: '#f5f0eb', color: 'var(--studio-accent)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                                Recommended
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--studio-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
                            {bm.tagline}
                          </p>
                          <div style={{ background: '#faf9f6', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--studio-accent)', marginBottom: '4px' }}>Why This Benchmark Works:</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6, color: '#444' }}>
                              {bm.whyItWorks?.slice(0, 3).map((w: string, idx: number) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--studio-muted)' }}>
                            <span style={{ background: '#f0eee8', padding: '2px 8px', borderRadius: '4px' }}>Tone: {bm.aestheticTone}</span>
                            <span style={{ background: '#f0eee8', padding: '2px 8px', borderRadius: '4px' }}>Font: {bm.fontPairing}</span>
                            <span style={{ background: '#f0eee8', padding: '2px 8px', borderRadius: '4px' }}>Hero: {bm.keyDesignFeatures?.heroVariant}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--studio-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: isPicked ? 'var(--studio-accent)' : 'var(--studio-muted)' }}>
                            {isPicked ? '✓ Applied as Blueprint' : 'Click to Apply Blueprint'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--studio-muted)' }}>{bm.url.replace('https://', '')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Design Direction Note */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#fcfbf8',
                border: '1px solid rgba(140, 89, 59, 0.2)',
                marginBottom: '28px',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              <b style={{ color: 'var(--studio-accent)' }}>Aesthetic Direction:</b> Minimal, natural, and organic tones
              (bone, limestone, terracotta accents). No bold gradients or generic AI cliches. Full utilization of the
              98-piece BrandScalers library with distinctiveness validation.
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(adaptiveQuestions && adaptiveQuestions.length > 0 ? 'clarify' : 'brief')}
                className="studio-btn"
                style={{ padding: '14px 20px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={18} /> Back &amp; Edit Brief
              </button>
              <button
                type="button"
                onClick={handleStartGeneration}
                className="studio-btn primary"
                style={{ flex: 1, justifyContent: 'center', padding: '14px 20px', fontSize: '16px' }}
              >
                Generate Website & Launch Editor <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Generation State Machine Progress */}
        {step === 'generating' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--studio-border)',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid #f0eee8',
                borderTopColor: 'var(--studio-accent)',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 10px' }}>
              Composing {businessName}
            </h2>
            <p style={{ color: 'var(--studio-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Matching 98 library pieces &bull; Deriving natural tokens &bull; Bounded Gemini content synthesis (≤ ₹8.00)
            </p>

            <div
              style={{
                background: '#faf9f6',
                borderRadius: '8px',
                padding: '16px',
                display: 'inline-flex',
                gap: '24px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--studio-muted)' }}>AI Provider:</span> <b>Google Gemini 3.5</b>
              </div>
              <div>
                <span style={{ color: 'var(--studio-muted)' }}>Status:</span> <b>Running QA Gates...</b>
              </div>
              <div>
                <span style={{ color: 'var(--studio-muted)' }}>Target Cost:</span> <b>≤ ₹8.00 INR</b>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
