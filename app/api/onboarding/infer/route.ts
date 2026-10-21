import { NextRequest, NextResponse } from 'next/server';
import { inferBusinessProfile } from '@/engine/context/inference';
import { selectAdaptiveQuestions } from '@/engine/questions/selector';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, businessCategory, offeringsAndGoals, websiteOrDemoUrl, referenceUrl } = body;

    if (!businessName || !offeringsAndGoals) {
      return NextResponse.json(
        { error: 'Business name and offerings/goals description are required.' },
        { status: 400 }
      );
    }

    const profile = inferBusinessProfile({
      businessName,
      businessCategory: businessCategory || "I'm not sure",
      offeringsAndGoals,
      websiteOrDemoUrl,
      referenceUrl,
    });

    const questions = selectAdaptiveQuestions(profile);

    return NextResponse.json({
      success: true,
      profile,
      questions,
    });
  } catch (error: any) {
    console.error('Inference error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error during profile inference.' },
      { status: 500 }
    );
  }
}
