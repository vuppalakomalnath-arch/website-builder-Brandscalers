const fs = require('fs');

let code = fs.readFileSync('app/(product)/editor/[projectId]/page.tsx', 'utf8');

// Replace component signature
const oldSig = 'export default function VisualEditorPage() {';
const newSig = `export interface VisualEditorClientProps {
  projectId: string;
  initialManifest?: any;
  initialDesignSystem?: any;
  initialContentBlocks?: any[];
  initialQualityReport?: any;
  initialCostTelemetry?: { totalCostINR: number; withinBudget: boolean };
}

export default function VisualEditorClient({
  projectId,
  initialManifest,
  initialDesignSystem,
  initialContentBlocks,
  initialQualityReport,
  initialCostTelemetry,
}: VisualEditorClientProps) {`;

code = code.replace(oldSig, newSig);

// Replace initial state definitions
code = code.replace(
  'const [manifest, setManifest] = useState<any>(null);',
  'const [manifest, setManifest] = useState<any>(initialManifest || null);'
);
code = code.replace(
  'const [designSystem, setDesignSystem] = useState<any>(null);',
  'const [designSystem, setDesignSystem] = useState<any>(initialDesignSystem || null);'
);
code = code.replace(
  'const [contentBlocks, setContentBlocks] = useState<any[]>([]);',
  'const [contentBlocks, setContentBlocks] = useState<any[]>(initialContentBlocks || []);'
);
code = code.replace(
  'const [qualityReport, setQualityReport] = useState<any>(null);',
  'const [qualityReport, setQualityReport] = useState<any>(initialQualityReport || null);'
);
code = code.replace(
  `  const [costTelemetry, setCostTelemetry] = useState<{ totalCostINR: number; withinBudget: boolean }>({
    totalCostINR: 0.08,
    withinBudget: true,
  });`,
  `  const [costTelemetry, setCostTelemetry] = useState<{ totalCostINR: number; withinBudget: boolean }>(
    initialCostTelemetry || { totalCostINR: 0.02, withinBudget: true }
  );`
);

code = code.replace(
  'const [history, setHistory] = useState<any[]>([]);',
  `const [history, setHistory] = useState<any[]>([
    {
      manifest: initialManifest,
      designSystem: initialDesignSystem,
      contentBlocks: initialContentBlocks || [],
    },
  ]);`
);
code = code.replace(
  'const [historyIndex, setHistoryIndex] = useState<number>(-1);',
  'const [historyIndex, setHistoryIndex] = useState<number>(initialManifest ? 0 : -1);'
);

fs.writeFileSync('app/(product)/editor/[projectId]/editor-client.tsx', code, 'utf8');
console.log('Created editor-client.tsx successfully!');
