'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Sparkles,
  Link2,
  Check,
  AlertCircle,
  Loader2,
  Play,
} from 'lucide-react';
import { MediaTarget } from '@/engine/rendering/preview-runtime';

export interface MediaUploadModalProps {
  target: MediaTarget;
  brandName: string;
  onClose: () => void;
  onApply: (url: string, mediaType: 'image' | 'video' | 'logo') => void;
  onAttachToCopilot?: (url: string, mediaType: 'image' | 'video' | 'logo', filename: string) => void;
}

const STOCK_COMMERCE_PRESETS = [
  {
    title: 'Artisan Ceramics & Home',
    url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1200&auto=format&fit=crop&q=80',
    category: 'Ceramics',
  },
  {
    title: 'Natural Linen & Textiles',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=1200&auto=format&fit=crop&q=80',
    category: 'Textiles',
  },
  {
    title: 'Minimalist Studio Space',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    category: 'Interior',
  },
  {
    title: 'Luxury Fashion Collection',
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop&q=80',
    category: 'Fashion',
  },
  {
    title: 'Organic Botanical Skincare',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop&q=80',
    category: 'Wellness',
  },
  {
    title: 'Artisanal Coffee Roastery',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    category: 'Dining',
  },
];

export function MediaUploadModal({
  target,
  brandName,
  onClose,
  onApply,
  onAttachToCopilot,
}: MediaUploadModalProps) {
  const initialTab =
    target.mediaType === 'logo'
      ? 'logo'
      : target.mediaType === 'video'
      ? 'youtube'
      : 'upload';

  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'logo' | 'stock'>(initialTab);
  const [selectedUrl, setSelectedUrl] = useState<string>(target.currentUrl || '');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'logo'>(target.mediaType);
  const [filename, setFilename] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // YouTube tab state
  const [youtubeInput, setYoutubeInput] = useState<string>(
    target.currentUrl?.includes('youtube.com') || target.currentUrl?.includes('youtu.be')
      ? target.currentUrl
      : ''
  );

  // Logo generator state
  const words = (brandName || 'House of Jaya').trim().split(/\s+/).filter(Boolean);
  const initials = ((words[0]?.[0] || 'H') + (words[1]?.[0] || words[0]?.[1] || 'J')).toUpperCase();
  const [selectedLogoStyle, setSelectedLogoStyle] = useState<'gold' | 'noir' | 'terracotta' | 'emerald'>('gold');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate SVG Monogram Data URI
  const generateSvgLogoUri = (style: 'gold' | 'noir' | 'terracotta' | 'emerald'): string => {
    let svg = '';
    if (style === 'gold') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="76" fill="#181512" stroke="#d4af37" stroke-width="4"/><circle cx="80" cy="80" r="68" fill="none" stroke="#d4af37" stroke-dasharray="3 3" stroke-width="1.5"/><text x="80" y="94" fill="#f5e6c8" font-family="Georgia, serif" font-size="44" font-weight="bold" text-anchor="middle" letter-spacing="2">${initials}</text></svg>`;
    } else if (style === 'noir') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="#0f0f10"/><text x="80" y="97" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="46" font-weight="800" text-anchor="middle" letter-spacing="-1">${initials}</text></svg>`;
    } else if (style === 'terracotta') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#8c593b"/><circle cx="80" cy="80" r="68" fill="none" stroke="#f6eedb" stroke-width="2.5"/><text x="80" y="95" fill="#f6eedb" font-family="Georgia, serif" font-size="44" font-weight="bold" text-anchor="middle">${initials}</text></svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="28" fill="#134e4a"/><polygon points="80,18 142,80 80,142 18,80" fill="none" stroke="#2dd4bf" stroke-width="2"/><text x="80" y="94" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="42" font-weight="bold" text-anchor="middle">${initials}</text></svg>`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Client-side file validation and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);
    const isVideo = ['.mp4', '.mp3'].includes(ext);

    // Validate format
    if (!isImage && !isVideo) {
      setUploadError(
        `Unsupported file format (${ext}). Images must strictly be JPG or PNG. Videos must strictly be MP4 or MP3.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size
    if (isImage && file.size > 5 * 1024 * 1024) {
      setUploadError(
        `Image size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 5MB maximum limit. Please compress or select another JPG/PNG image.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (isVideo && file.size > 10 * 1024 * 1024) {
      setUploadError(
        `Video size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 10MB maximum limit. Please select an MP4 or MP3 file under 10MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setSelectedUrl(data.url);
      setFilename(file.name);
      setMediaType(isImage ? (target.mediaType === 'logo' ? 'logo' : 'image') : 'video');
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // YouTube embed converter
  const handleYoutubeChange = (val: string) => {
    setYoutubeInput(val);
    setUploadError(null);
    if (!val.trim()) {
      return;
    }

    const reg = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/;
    const match = val.match(reg);
    if (match && match[1]) {
      const embedUrl = `https://www.youtube.com/embed/${match[1]}`;
      setSelectedUrl(embedUrl);
      setMediaType('video');
      setFilename(`YouTube: ${match[1]}`);
    } else {
      setUploadError('Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=...)');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2d9cf',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #ede7df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#faf8f5',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>
                {target.mediaType === 'logo' ? '👑' : target.mediaType === 'video' ? '🎬' : '🖼️'}
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#27201c' }}>
                {target.title || 'Add / Update Media'}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#736558' }}>
              Target: <code style={{ background: '#eee7de', padding: '1px 5px', borderRadius: '4px' }}>{target.field}</code> &bull; Formats: JPG/PNG ≤ 5MB &bull; MP4/MP3 ≤ 10MB
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#736558',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ede7df', padding: '0 16px', background: '#fff' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'upload' ? '2px solid #8a5334' : '2px solid transparent',
              color: activeTab === 'upload' ? '#8a5334' : '#736558',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Upload size={14} />
            Upload File
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'youtube' ? '2px solid #8a5334' : '2px solid transparent',
              color: activeTab === 'youtube' ? '#8a5334' : '#736558',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Video size={14} />
            YouTube Embed
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('logo');
              const uri = generateSvgLogoUri(selectedLogoStyle);
              setSelectedUrl(uri);
              setMediaType('logo');
              setFilename(`${brandName} Vector Logo`);
            }}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'logo' ? '2px solid #8a5334' : '2px solid transparent',
              color: activeTab === 'logo' ? '#8a5334' : '#736558',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            AI Vector Logo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'stock' ? '2px solid #8a5334' : '2px solid transparent',
              color: activeTab === 'stock' ? '#8a5334' : '#736558',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ImageIcon size={14} />
            Stock Presets
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Error Banner */}
          {uploadError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.mp4,.mp3"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #cfc5b8',
                  borderRadius: '10px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#faf8f5',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  marginBottom: '16px',
                }}
              >
                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={28} className="spin" color="#8a5334" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#8a5334' }}>
                      Validating &amp; Uploading Media...
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ede5dc', margin: '0 auto 12px', display: 'grid', placeItems: 'center', color: '#8a5334' }}>
                      <Upload size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#332a24' }}>
                      Click or drag file to upload
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#7a6c5f' }}>
                      <b>Images:</b> JPG or PNG format (max 5MB) &bull; <b>Videos:</b> MP4 or MP3 (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE EMBED */}
          {activeTab === 'youtube' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#332a24' }}>
                YouTube Video URL
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => handleYoutubeChange(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d4c7b8',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <small style={{ color: '#7a6c5f', fontSize: '11px', display: 'block', marginBottom: '16px' }}>
                Paste any standard YouTube video, shorts, or share link. It will automatically convert to an embedded responsive player.
              </small>
            </div>
          )}

          {/* TAB 3: AI VECTOR LOGO */}
          {activeTab === 'logo' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#332a24' }}>
                  Select Monogram Seal Style for &ldquo;{brandName}&rdquo; ({initials})
                </label>
                <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#7a6c5f' }}>
                  Crisp vector SVG emblems generated instantly for your luxury brand:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { id: 'gold', title: 'Gold Seal', color: '#d4af37' },
                  { id: 'noir', title: 'Noir Studio', color: '#111111' },
                  { id: 'terracotta', title: 'Terracotta', color: '#8c593b' },
                  { id: 'emerald', title: 'Emerald Luxe', color: '#134e4a' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedLogoStyle(s.id as any);
                      const uri = generateSvgLogoUri(s.id as any);
                      setSelectedUrl(uri);
                      setMediaType('logo');
                      setFilename(`${brandName} (${s.title}) Logo`);
                    }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: selectedLogoStyle === s.id ? '2px solid #8a5334' : '1px solid #e2d9cf',
                      background: selectedLogoStyle === s.id ? '#faf3eb' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: s.color, margin: '0 auto 8px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                      {initials}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#332a24' }}>{s.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STOCK PRESETS */}
          {activeTab === 'stock' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#7a6c5f' }}>
                Select from verified high-resolution commerce photography:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {STOCK_COMMERCE_PRESETS.map((stock, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedUrl(stock.url);
                      setMediaType('image');
                      setFilename(stock.title);
                    }}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedUrl === stock.url ? '2px solid #8a5334' : '1px solid #e0d5c8',
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    <div style={{ height: '80px', overflow: 'hidden' }}>
                      <img src={stock.url} alt={stock.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: '#332a24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stock.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE PREVIEW OF SELECTED MEDIA */}
          {selectedUrl && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                background: '#fcfaf7',
                borderRadius: '10px',
                border: '1px solid #e5ded4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a2e25', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Preview Selected Media
                </span>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} /> Ready to apply
                </span>
              </div>

              <div
                style={{
                  height: '180px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#151515',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedUrl.includes('youtube.com/embed') ? (
                  <iframe
                    src={selectedUrl}
                    title="Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : selectedUrl.endsWith('.mp4') || selectedUrl.endsWith('.mp3') ? (
                  <video src={selectedUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <img
                    src={selectedUrl}
                    alt="Preview"
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: mediaType === 'logo' ? 'contain' : 'cover',
                      padding: mediaType === 'logo' ? '20px' : 0,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #ede7df',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#faf8f5',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d4c7b8',
              background: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#5c4838',
            }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onAttachToCopilot && (
              <button
                type="button"
                disabled={!selectedUrl || isUploading}
                onClick={() => {
                  if (selectedUrl) {
                    onAttachToCopilot(selectedUrl, mediaType, filename || 'Selected Media');
                  }
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #8a5334',
                  background: '#fff',
                  color: '#8a5334',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: !selectedUrl || isUploading ? 'not-allowed' : 'pointer',
                  opacity: !selectedUrl || isUploading ? 0.5 : 1,
                }}
              >
                📎 Attach to AI Copilot
              </button>
            )}

            <button
              type="button"
              disabled={!selectedUrl || isUploading}
              onClick={() => {
                if (selectedUrl) {
                  onApply(selectedUrl, mediaType);
                }
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: !selectedUrl || isUploading ? '#dfd7cf' : '#8a5334',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: !selectedUrl || isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} />
              Apply Directly to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
