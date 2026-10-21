import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await prisma.generationRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ error: 'Generation run not found.' }, { status: 404 });
    }

    const usage = await prisma.aiUsageLedger.findMany({
      where: { runId: id },
    });

    return NextResponse.json({
      success: true,
      run,
      usage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch generation status.' },
      { status: 500 }
    );
  }
}
