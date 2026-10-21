# Website Studio

> **Structured website-generation engine with an interactive visual editor**  
> Single Source of Truth (SSOT v2.1) & BrandScalers Design Library (98 Pieces / 292 Looks)

---

## 🌟 Key Features

1. **Minimal Onboarding (R1)**: Requires only 3 initial inputs (Business Name, Category, Offerings & Goals) + 2 optional links. Adaptive clarification asks at most 1 high-impact question when needed.
2. **Deterministic Architecture (R2, R3, R7)**: Taxonomy classification, visitor journey planning, component look selection, 16 design dials calculation, and visual editing execute locally at **₹0 AI cost**.
3. **Full BrandScalers Library Ingestion (R4)**: Complete verified coverage of all **98 pieces and 292 looks** across 10 pattern families (Frame, Opener, Offer, Trust, Media, Answer, Action, Content, Motion, Verticals).
4. **Natural, Minimal & Modern Aesthetics**: Earthy, organic color palettes (warm limestone, bone, sandstone, terracotta, muted sage, slate navy) with zero loud/bold gradients or AI tropes.
5. **Real Responsive Preview (R5)**: Desktop, Tablet (768px), and Mobile (375px) viewports with truthful interactive simulation.
6. **Comprehensive Visual Editor (R6)**:
   - Direct inline text editing
   - 16 Design Dials property inspector
   - Component look variant switcher
   - Section navigator and visibility toggles
   - Debounced autosave (800ms) and undo/redo
   - Reversible point-in-time version history
7. **Bounded Google Gemini AI (≤ ₹8.00 Target)**: Reserved strictly for bounded marketing copywriting via Gemini 3.5 Flash. Real-time token and INR cost ledger logged to MongoDB Atlas.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- MongoDB Atlas cluster connection string
- Google Gemini API key

### 2. Environment Setup
Create `.env` file:
```env
GEMINI_API_KEY="your-gemini-api-key"
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.uj6hf2n.mongodb.net/website_studio?retryWrites=true&w=majority"
NODE_ENV="development"
PORT=3000
```

### 3. Install & Sync Database
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to create and edit websites.

---

## 📊 Scripts
- `npm run dev`: Launch local development server
- `npm run build`: Compile Next.js production build
- `npm run library:ingest`: Re-audit and extract all 98 pieces and 292 looks from `BrandScalers-Design-Library-292-looks.html`
- `npm run benchmark`: Execute automated test briefs to verify the ≤ ₹8.00 AI cost target and 5-category QA gates
