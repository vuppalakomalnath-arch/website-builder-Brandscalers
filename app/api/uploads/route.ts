import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Max limits:
// Image: JPG or PNG, <= 5MB
// Video/Audio: MP4 or MP3, <= 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Handle YouTube or Direct Video URL link conversion
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { youtubeUrl, videoUrl } = body;
      const targetUrl = youtubeUrl || videoUrl;

      if (!targetUrl || typeof targetUrl !== 'string') {
        return NextResponse.json({ error: 'Valid URL is required.' }, { status: 400 });
      }

      // Convert YouTube link to embed format
      const ytMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
        return NextResponse.json({
          success: true,
          type: 'youtube',
          url: embedUrl,
          rawUrl: targetUrl,
        });
      }

      return NextResponse.json({
        success: true,
        type: 'direct_url',
        url: targetUrl,
      });
    }

    // 2. Handle File Upload (FormData)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mediaCategory = (formData.get('category') as string) || 'auto'; // 'image' | 'video' | 'logo'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    const fileSize = file.size;

    // Check if image
    const isJpgOrPng =
      filename.endsWith('.jpg') ||
      filename.endsWith('.jpeg') ||
      filename.endsWith('.png') ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/png';

    // Check if video/audio
    const isMp4OrMp3 =
      filename.endsWith('.mp4') ||
      filename.endsWith('.mp3') ||
      mimeType === 'video/mp4' ||
      mimeType === 'audio/mpeg' ||
      mimeType === 'audio/mp3';

    if (isJpgOrPng) {
      if (fileSize > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `Image exceeds maximum allowed size of 5MB (uploaded size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB). Must be JPG or PNG up to 5MB.` },
          { status: 400 }
        );
      }
    } else if (isMp4OrMp3) {
      if (fileSize > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: `Video/Audio exceeds maximum allowed size of 10MB (uploaded size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB). Must be MP4 or MP3 up to 10MB.` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            'Invalid file format. Images must be JPG or PNG (up to 5MB). Videos must be MP4 or MP3 (up to 10MB).',
        },
        { status: 400 }
      );
    }

    // Read bytes
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate safe filename
    const safeExt = path.extname(filename) || (isJpgOrPng ? '.png' : '.mp4');
    const uniqueName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetFilePath = path.join(uploadsDir, uniqueName);
    await fs.promises.writeFile(targetFilePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    // Base64 fallback for instant in-browser persistence
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType || (isJpgOrPng ? 'image/png' : 'video/mp4')};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      dataUrl: fileSize <= 2 * 1024 * 1024 ? dataUrl : publicUrl, // Base64 if <= 2MB
      filename: uniqueName,
      originalName: file.name,
      fileSize,
      mediaType: isJpgOrPng ? 'image' : 'video',
    });
  } catch (error: any) {
    console.error('Upload handling error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed.' },
      { status: 500 }
    );
  }
}
