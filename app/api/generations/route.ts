import { NextRequest, NextResponse } from 'next/server';
import { executeGenerationPipeline } from '@/engine/orchestration/runner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, brief } = body;

    if (!brief || !brief.businessName) {
      return NextResponse.json(
        { error: 'Valid brief with businessName is required.' },
        { status: 400 }
      );
    }

    const result = await executeGenerationPipeline({
      projectId,
      brief,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Generation pipeline error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation pipeline execution failed.' },
      { status: 500 }
    );
  }
}
