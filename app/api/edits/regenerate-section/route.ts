import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { GeminiAdapter } from '@/server/gemini/adapter';

function generateSvgLogoDataUri(brandName: string, tone?: string): string {
  const words = (brandName || 'Brand').trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (brandName || 'Brand').slice(0, 2).toUpperCase();

  const color = '#8a5334';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="${color}"/><circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/><text x="50%" y="54%" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="24" font-weight="700" fill="#ffffff" dominant-baseline="middle" text-anchor="middle" letter-spacing="1.5">${initials}</text></svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      instanceId,
      pieceId,
      pieceTitle,
      variantName,
      availableVariants,
      userPrompt,
      userInstruction,
      currentProps,
      businessProfile,
    } = body;

    const promptText = userPrompt || userInstruction;

    if (!projectId || !instanceId || !promptText) {
      return NextResponse.json(
        { error: 'Missing projectId, instanceId, or userPrompt/userInstruction.' },
        { status: 400 }
      );
    }

    const bizName = businessProfile?.businessName || 'Brand';
    const bizCategory = businessProfile?.businessCategory || 'General Business';
    const bizTone = businessProfile?.brandTone || 'natural-modern';

    const validVariantsList = Array.isArray(availableVariants) && availableVariants.length > 0
      ? availableVariants.join(', ')
      : 'default';

    // Construct bounded prompt for Gemini
    const systemInstruction = `You are an elite website architect, copywriter, and UI designer for Website Studio.
You efficiently make real, tangible, and working changes to website sections based on user guidance.
Brand: "${bizName}" (${bizCategory}).
Aesthetic tone: "${bizTone}". Follow minimal, natural, modern principles. Avoid loud buzzwords, hyperbolic clichés, or fake marketing jargon.

You must return a single JSON object with:
1. "updatedProps": Object with all updated and enhanced section props (heading, subheading, eyebrow, ctaLabel, ctaHref, secondaryCtaLabel, secondaryCtaHref, items, testimonials, faqs, numbers, etc.).
   - If the user asks for new cards, products, services, FAQs, or reviews, generate complete high-quality items matching the schema.
   - All fields should be fully drafted, specific to ${bizName}, and ready for production.
2. "variantName": If the user's instructions request or imply a visual/layout change (e.g. centered, split, dark overlay, 4-column, mosaic, cards, tabs, video, etc.), pick the best matching variant from available variants: [${validVariantsList}]. If no variant change is requested, keep "${variantName || 'default'}".
3. "summaryOfChanges": A concise 1-sentence description of the changes applied (e.g., "Updated hero copy for organic botanical apothecary and switched layout to centered.").

Output ONLY raw valid JSON. Do NOT include markdown fences or backticks.`;

    const prompt = `Perform the requested modifications for this website section:

Section: ${pieceTitle || pieceId} (${pieceId})
Current Variant / Look: ${variantName || 'default'}
Available Variants for this Section: [${validVariantsList}]

Current Props:
${JSON.stringify(currentProps || {}, null, 2)}

User's Editing Instructions:
"${promptText}"

Generate the complete "updatedProps", chosen "variantName", and "summaryOfChanges".`;

    // Execute bounded AI generation
    const aiResult = await GeminiAdapter.generateBoundedContent(
      {
        projectId,
        stage: 'section_regeneration',
        prompt,
        systemInstruction,
        promptVersion: 'v2.1-copilot-engine',
      },
      () => {
        // Deterministic fallback if API offline or budget ceiling reached
        const fallback = { ...(currentProps || {}) };
        const lowerPrompt = (promptText || '').toLowerCase();
        let fallbackVariant = variantName || 'default';

        // Check if user requested a layout or variant change
        if (Array.isArray(availableVariants)) {
          for (const v of availableVariants) {
            if (lowerPrompt.includes(v.toLowerCase())) {
              fallbackVariant = v;
              break;
            }
          }
        }

        if (lowerPrompt.includes('center')) {
          fallbackVariant = 'centered';
        } else if (lowerPrompt.includes('dark')) {
          fallbackVariant = 'dark-overlay';
        } else if (lowerPrompt.includes('split')) {
          fallbackVariant = 'split';
        } else if (lowerPrompt.includes('fullscreen')) {
          fallbackVariant = 'fullscreen-image';
        } else if (lowerPrompt.includes('4 col') || lowerPrompt.includes('4-col')) {
          fallbackVariant = '4-col';
        } else if (lowerPrompt.includes('mosaic')) {
          fallbackVariant = 'mosaic';
        }

        if (lowerPrompt.includes('urgent') || lowerPrompt.includes('discount')) {
          fallback.eyebrow = 'Limited Time Exclusive';
          fallback.heading = `${bizName} Special Launch Access`;
          fallback.subheading = `${fallback.subheading || ''} Take advantage of complimentary consultation and priority access this week.`;
          fallback.ctaLabel = 'Claim Access Now';
        } else if (lowerPrompt.includes('luxury') || lowerPrompt.includes('premium')) {
          fallback.eyebrow = 'Signature Private Edition';
          fallback.heading = `Refined Distinction by ${bizName}`;
          fallback.subheading = 'Crafted without compromise for those who appreciate understated distinction.';
          fallback.ctaLabel = 'Explore Collection';
        } else {
          fallback.heading = `${bizName}: Designed for Excellence`;
          fallback.subheading = `${promptText}. Handcrafted with care and modern precision.`;
        }

        return {
          updatedProps: fallback,
          variantName: fallbackVariant,
          summaryOfChanges: `Updated section copy and styling based on "${promptText.slice(0, 40)}..."`,
        };
      }
    );

    let updatedProps = currentProps || {};
    let chosenVariant = variantName;
    let summaryOfChanges = 'Section updated successfully.';

    if (aiResult.success && aiResult.data) {
      let parsed: any = aiResult.data;
      if (typeof parsed === 'string') {
        try {
          const cleaned = parsed.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.warn('Could not parse Gemini output string as JSON');
        }
      }

      if (parsed && typeof parsed === 'object') {
        if (parsed.updatedProps && typeof parsed.updatedProps === 'object') {
          updatedProps = { ...currentProps, ...parsed.updatedProps };
        } else {
          // If Gemini returned flat props object
          const { variantName: vName, summaryOfChanges: sChange, ...restProps } = parsed;
          updatedProps = { ...currentProps, ...restProps };
        }

        if (parsed.variantName && typeof parsed.variantName === 'string') {
          chosenVariant = parsed.variantName;
        }
        if (parsed.summaryOfChanges) {
          summaryOfChanges = parsed.summaryOfChanges;
        }
      }
    } else if ((aiResult as any).rawText) {
      try {
        const cleaned = ((aiResult as any).rawText as string).replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.updatedProps) {
          updatedProps = { ...currentProps, ...parsed.updatedProps };
        } else {
          const { variantName: vName, summaryOfChanges: sChange, ...restProps } = parsed;
          updatedProps = { ...currentProps, ...restProps };
        }
        if (parsed.variantName) chosenVariant = parsed.variantName;
        if (parsed.summaryOfChanges) summaryOfChanges = parsed.summaryOfChanges;
      } catch (e) {
        console.warn('Could not parse rawText as JSON');
      }
    }

    // Media attachment and logo handling
    const mediaUrl = body.mediaUrl || body.logoUrl || body.imageUrl || body.videoUrl;
    const isLogoPrompt = promptText.toLowerCase().includes('logo');
    const isVideoPrompt = promptText.toLowerCase().includes('video') || promptText.toLowerCase().includes('youtube');

    if (body.logoUrl) {
      updatedProps.logoUrl = body.logoUrl;
    } else if (isLogoPrompt && !updatedProps.logoUrl) {
      if (mediaUrl) {
        updatedProps.logoUrl = mediaUrl;
      } else {
        // Generate tailored SVG vector logo data URI for the business
        updatedProps.logoUrl = generateSvgLogoDataUri(bizName, bizTone);
      }
    }

    if (body.imageUrl) {
      updatedProps.imageUrl = body.imageUrl;
    } else if (mediaUrl && !isLogoPrompt && !isVideoPrompt) {
      updatedProps.imageUrl = mediaUrl;
    }

    if (body.videoUrl) {
      updatedProps.videoUrl = body.videoUrl;
    } else if (isVideoPrompt && mediaUrl) {
      updatedProps.videoUrl = mediaUrl;
    }

    // Persist to latest project version in DB if valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(projectId);
    if (isValidObjectId) {
      try {
        const latestVersion = await prisma.projectVersion.findFirst({
          where: { projectId },
          orderBy: { versionNumber: 'desc' },
        });

        if (latestVersion && latestVersion.manifest) {
          const manifest = JSON.parse(JSON.stringify(latestVersion.manifest));
          let found = false;
          if (Array.isArray(manifest.pages)) {
            for (const page of manifest.pages) {
              if (Array.isArray(page.componentInstances)) {
                for (const ci of page.componentInstances) {
                  if (ci.instanceId === instanceId) {
                    ci.props = updatedProps;
                    if (chosenVariant) {
                      ci.variantName = chosenVariant;
                      ci.lookVariantId = chosenVariant;
                    }
                    found = true;
                    break;
                  }
                }
              }
              if (found) break;
            }
          }

          if (found) {
            await prisma.projectVersion.create({
              data: {
                projectId,
                versionNumber: (latestVersion.versionNumber || 1) + 1,
                businessProfile: latestVersion.businessProfile || {},
                sitePlan: latestVersion.sitePlan || {},
                designSystem: latestVersion.designSystem || {},
                manifest,
                contentBlocks: latestVersion.contentBlocks || [],
              },
            });

            await prisma.auditEvent.create({
              data: {
                projectId,
                action: 'ai_section_regeneration',
                payload: {
                  instanceId,
                  pieceId,
                  promptText,
                  variantName: chosenVariant,
                  costINR: aiResult.costINR,
                },
              },
            });
          }
        }
      } catch (dbError) {
        console.warn('DB persistence skipped or failed for section regeneration:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      updatedProps,
      variantName: chosenVariant,
      summaryOfChanges,
      costINR: aiResult.costINR || 0.02,
      tokensUsed: (aiResult.inputTokens || 0) + (aiResult.outputTokens || 0),
      fallbackUsed: !!aiResult.fallbackUsed,
    });
  } catch (error: any) {
    console.error('Section regeneration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate section.' },
      { status: 500 }
    );
  }
}
