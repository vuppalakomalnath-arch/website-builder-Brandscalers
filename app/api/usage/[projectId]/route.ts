import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const ledger = await prisma.aiUsageLedger.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const totalCalls = ledger.length;
    const totalInputTokens = ledger.reduce((acc, row) => acc + row.inputTokens, 0);
    const totalOutputTokens = ledger.reduce((acc, row) => acc + row.outputTokens, 0);
    const totalCostINR = ledger.reduce((acc, row) => acc + row.estimatedCostINR, 0);

    return NextResponse.json({
      success: true,
      projectId,
      totalCalls,
      totalInputTokens,
      totalOutputTokens,
      totalCostINR: Number(totalCostINR.toFixed(4)),
      budgetTargetINR: 8.0,
      withinBudget: totalCostINR <= 8.0,
      history: ledger,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage ledger.' },
      { status: 500 }
    );
  }
}
