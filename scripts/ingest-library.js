const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '..', 'BrandScalers-Design-Library-292-looks.html');
const REGISTRY_DIR = path.join(__dirname, '..', 'registry');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

if (!fs.existsSync(REGISTRY_DIR)) fs.mkdirSync(REGISTRY_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

console.log('Reading source library from:', SOURCE_PATH);
const html = fs.readFileSync(SOURCE_PATH, 'utf8');

// 1. Extract CSS
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  const css = styleMatch[1];
  fs.writeFileSync(path.join(REGISTRY_DIR, 'brandscalers-library.css'), css, 'utf8');
  console.log('Extracted CSS to registry/brandscalers-library.css (length:', css.length, ')');
}

// 2. Extract Pieces & Variants
// Split by section.pg-piece
const pieceParts = html.split('<section class="pg-piece"');
const pieces = [];
let totalLooks = 0;

for (let i = 1; i < pieceParts.length; i++) {
  const part = pieceParts[i];
  const idMatch = part.match(/id="([^"]+)"/);
  const catMatch = part.match(/data-cat="([^"]+)"/);
  const nameMatch = part.match(/data-name="([^"]+)"/);
  const h2Match = part.match(/<h2>([^<]+)<\/h2>/);
  const codeMatch = part.match(/<code>([^<]+)<\/code>/);
  const descMatch = part.match(/<p>([^<]+)<\/p>/);

  const pieceId = idMatch ? idMatch[1] : `piece-${i}`;
  const cat = catMatch ? catMatch[1] : 'general';
  const title = h2Match ? h2Match[1].trim() : (nameMatch ? nameMatch[1] : pieceId);
  const code = codeMatch ? codeMatch[1].trim() : '';
  const description = descMatch ? descMatch[1].trim() : '';

  // Split into variants
  const variantParts = part.split('<div class="pg-variant"');
  const variants = [];

  for (let j = 1; j < variantParts.length; j++) {
    const vPart = variantParts[j];
    const vIdMatch = vPart.match(/id="([^"]+)"/);
    const vHeadMatch = vPart.match(/<div class="pg-vhead"><b>([^<]+)<\/b><\/div>/);
    const frameMatch = vPart.match(/<div class="pg-frame[^"]*">([\s\S]*)/);

    const vId = vIdMatch ? vIdMatch[1] : `${pieceId}-var-${j}`;
    const vName = vHeadMatch ? vHeadMatch[1].trim() : `variant-${j}`;
    
    // Clean snippet
    let snippet = '';
    if (frameMatch) {
      snippet = frameMatch[1];
      // strip any trailing section/main closure
      const endIdx = snippet.lastIndexOf('</section>');
      if (endIdx !== -1) {
        snippet = snippet.substring(0, endIdx + 10);
      }
    }

    variants.push({
      id: vId,
      name: vName,
      htmlSnippet: snippet.trim(),
      status: 'validated',
    });
    totalLooks++;
  }

  pieces.push({
    id: pieceId,
    category: cat,
    title,
    code,
    description,
    variantsCount: variants.length,
    variants,
    status: 'validated',
  });
}

const registryData = {
  version: '2.1.0',
  auditedAt: new Date().toISOString(),
  totalPieces: pieces.length,
  totalLooks: totalLooks,
  categories: [...new Set(pieces.map(p => p.category))],
  pieces,
};

fs.writeFileSync(path.join(REGISTRY_DIR, 'library-registry.json'), JSON.stringify(registryData, null, 2), 'utf8');
console.log(`Ingested ${pieces.length} pieces and ${totalLooks} looks into registry/library-registry.json`);

// 3. Generate Coverage Report
const coverageReport = {
  sourceInventoryStated: { pieces: 98, looks: 292 },
  ingestedInventory: { pieces: pieces.length, looks: totalLooks },
  verifiedMatch: pieces.length === 98 && totalLooks === 292,
  breakdownByCategory: {},
};

pieces.forEach(p => {
  if (!coverageReport.breakdownByCategory[p.category]) {
    coverageReport.breakdownByCategory[p.category] = { piecesCount: 0, looksCount: 0, pieces: [] };
  }
  coverageReport.breakdownByCategory[p.category].piecesCount++;
  coverageReport.breakdownByCategory[p.category].looksCount += p.variantsCount;
  coverageReport.breakdownByCategory[p.category].pieces.push({
    id: p.id,
    title: p.title,
    looksCount: p.variantsCount,
    looks: p.variants.map(v => v.name),
  });
});

fs.writeFileSync(path.join(DOCS_DIR, 'design-library-coverage.json'), JSON.stringify(coverageReport, null, 2), 'utf8');
console.log('Saved coverage report to docs/design-library-coverage.json');
console.log('Verified Match:', coverageReport.verifiedMatch);
