import express from 'express';
import cors from 'cors';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

export interface MotorcycleSpecs {
  brand: string;
  model: string;
  variant?: string;
  body_type?: string;
  fuel_type?: string;
  segment_group?: string;
  ex_showroom_price_inr?: number;
  engine_cc?: number;
  power_bhp?: number;
  torque_nm?: number;
  mileage_kmpl?: number;
  top_speed_kmph?: number;
  transmission?: string;
  kerb_weight_kg?: number;
  seat_height_mm?: number;
  ground_clearance_mm?: number;
  fuel_tank_l?: string;
  wheelbase_mm?: number;
  braking_front?: string;
  braking_rear?: string;
  abs_channels?: string;
  suspension_front?: string;
  suspension_rear?: string;
  digital_cluster_yn?: string;
  bluetooth_yn?: string;
  keyless_start_yn?: string;
  usb_charging_yn?: string;
  led_lighting_yn?: string;
  warranty?: string;
}

export interface ChunkRecord {
  chunk_id: string;
  motorcycle_id?: string;
  brand?: string;
  model?: string;
  variant?: string;
  body_type?: string;
  segment_group?: string;
  youtube_url?: string;
  chunk_index?: number;
  word_count?: number;
  text: string;
  embedding_text?: string;
}

export interface Source {
  chunk_id: string;
  motorcycle_id?: string;
  brand?: string;
  model?: string;
  variant?: string;
  youtube_url?: string;
  snippet: string;
  specs?: MotorcycleSpecs;
}

export interface MotorcycleBrief {
  motorcycle_id: string;
  brand?: string;
  model?: string;
  variant?: string;
  body_type?: string;
  ex_showroom_price_inr?: number;
  engine_cc?: number;
  power_bhp?: number;
  mileage_kmpl?: number;
  youtube_url?: string;
  specs?: MotorcycleSpecs;
}

// Convert watch/share YouTube links to embed links
function formatYouTubeEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    if (url.includes('/embed/')) return url;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    return url;
  } catch {
    return url;
  }
}

// --- BM25 Search Index ---
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1);
}

function normalizeQuery(text: string): string {
  let cleaned = text.toLowerCase();
  const fixes: [RegExp, string][] = [
    [/\bmotorcyle\b/g, 'motorcycle'],
    [/\bcontrole\b/g, 'control'],
    [/\bcruize\b/g, 'cruise'],
    [/\bhimalyan\b/g, 'himalayan'],
    [/\broyalenfield\b/g, 'royal enfield'],
    [/\btriumphspeed\b/g, 'triumph speed'],
  ];
  for (const [re, rep] of fixes) {
    cleaned = cleaned.replace(re, rep);
  }
  return cleaned;
}

class BM25Index {
  private chunks: ChunkRecord[] = [];
  private docLengths: number[] = [];
  private avgdl = 0;
  private df: Map<string, number> = new Map();
  private invertedIndex: Map<string, Map<number, number>> = new Map();
  private k1 = 1.5;
  private b = 0.75;

  build(chunks: ChunkRecord[]) {
    this.chunks = chunks;
    let totalLen = 0;
    this.docLengths = Array.from({ length: chunks.length }, () => 0);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const text = `${chunk.brand || ''} ${chunk.model || ''} ${chunk.variant || ''} ${chunk.body_type || ''} ${chunk.text}`;
      const tokens = tokenize(text);
      this.docLengths[i] = tokens.length;
      totalLen += tokens.length;

      const tfMap = new Map<string, number>();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      for (const [token, tf] of tfMap.entries()) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Map());
        }
        this.invertedIndex.get(token)!.set(i, tf);
        this.df.set(token, (this.df.get(token) || 0) + 1);
      }
    }

    this.avgdl = chunks.length > 0 ? totalLen / chunks.length : 1;
  }

  search(
    query: string,
    brand?: string,
    motorcycleId?: string,
    bodyType?: string,
    topK = 5
  ): ChunkRecord[] {
    const normalizedQ = normalizeQuery(query);
    const qTokens = tokenize(normalizedQ);
    const N = this.chunks.length;
    if (N === 0) return [];

    const scores = new Map<number, number>();
    const queryLower = normalizedQ.toLowerCase();

    for (const token of qTokens) {
      const docTfs = this.invertedIndex.get(token);
      if (!docTfs) continue;
      const docFreq = this.df.get(token) || 1;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);

      for (const [docIdx, tf] of docTfs.entries()) {
        const docLen = this.docLengths[docIdx];
        const tfComponent =
          (tf * (this.k1 + 1)) /
          (tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgdl)));
        const termScore = idf * tfComponent;
        scores.set(docIdx, (scores.get(docIdx) || 0) + termScore);
      }
    }

    const candidates: { idx: number; score: number }[] = [];
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (brand && chunk.brand?.toLowerCase() !== brand.toLowerCase()) {
        continue;
      }
      if (motorcycleId && chunk.motorcycle_id !== motorcycleId) {
        continue;
      }
      if (bodyType && bodyType !== 'All') {
        const cType = (chunk.body_type || '').toLowerCase();
        const bType = bodyType.toLowerCase();
        const matches =
          cType.includes(bType) ||
          bType.includes(cType) ||
          ((bType.includes('cruiser') || bType.includes('retro')) &&
            (cType.includes('cruiser') || cType.includes('retro') || cType.includes('cafe'))) ||
          (bType.includes('naked') && (cType.includes('naked') || cType.includes('street'))) ||
          (bType.includes('sport') && (cType.includes('sport') || cType.includes('superbike')));
        if (!matches) continue;
      }

      let score = scores.get(i) || 0;
      const chunkLower = chunk.text.toLowerCase();

      const brandLower = chunk.brand?.toLowerCase() || '';
      const modelLower = chunk.model?.toLowerCase() || '';
      if (brandLower && queryLower.includes(brandLower)) {
        score += 4.5;
      }
      if (modelLower && queryLower.includes(modelLower)) {
        score += 8.0;
      }

      // Feature specific boosts
      if (queryLower.includes('cruise') && chunkLower.includes('cruise')) {
        score += 5.0;
      }
      if (queryLower.includes('retro') && (chunkLower.includes('retro') || chunkLower.includes('classic') || (chunk.body_type || '').toLowerCase().includes('retro'))) {
        score += 5.0;
      }

      if (score > 0) {
        candidates.push({ idx: i, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      for (let i = 0; i < this.chunks.length; i++) {
        const chunk = this.chunks[i];
        if (brand && chunk.brand?.toLowerCase() !== brand.toLowerCase()) continue;
        if (motorcycleId && chunk.motorcycle_id !== motorcycleId) continue;
        if (bodyType && bodyType !== 'All' && chunk.body_type?.toLowerCase() !== bodyType.toLowerCase()) continue;
        candidates.push({ idx: i, score: 0 });
        if (candidates.length >= topK) break;
      }
    }

    return candidates.slice(0, topK).map((c) => this.chunks[c.idx]);
  }
}

// In-memory state
const chunks: ChunkRecord[] = [];
const chunksById = new Map<string, ChunkRecord>();
const specsByBrandModel = new Map<string, MotorcycleSpecs>();
let motorcycles: MotorcycleBrief[] = [];
const bm25 = new BM25Index();

// Parse CSV line safely
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// Load CSV specs
function loadSpecs(): void {
  const csvPath = path.resolve(process.cwd(), 'data/processed/ice_motorcycles.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('Specs CSV not found at:', csvPath);
    return;
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return;

  const header = parseCsvLine(lines[0]);
  const col = (name: string) => header.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < header.length) continue;

    const brand = row[col('brand')];
    const model = row[col('model')];
    if (!brand || !model) continue;

    const num = (idx: number) => {
      const val = parseFloat(row[idx]);
      return isNaN(val) ? undefined : val;
    };

    const specs: MotorcycleSpecs = {
      brand,
      model,
      variant: row[col('variant')] || undefined,
      body_type: row[col('body_type')] || undefined,
      fuel_type: row[col('fuel_type')] || undefined,
      segment_group: row[col('segment_group')] || undefined,
      ex_showroom_price_inr: num(col('ex_showroom_price_inr')),
      engine_cc: num(col('engine_cc_or_battery_kwh')),
      power_bhp: num(col('power_bhp_or_kw')),
      torque_nm: num(col('torque_nm')),
      mileage_kmpl: num(col('mileage_kmpl_or_range_km')),
      top_speed_kmph: num(col('top_speed_kmph')),
      transmission: row[col('transmission')] || undefined,
      kerb_weight_kg: num(col('kerb_weight_kg')),
      seat_height_mm: num(col('seat_height_mm')),
      ground_clearance_mm: num(col('ground_clearance_mm')),
      fuel_tank_l: row[col('fuel_tank_l_or_charge_time_hrs')] || undefined,
      wheelbase_mm: num(col('wheelbase_mm')),
      braking_front: row[col('braking_front')] || undefined,
      braking_rear: row[col('braking_rear')] || undefined,
      abs_channels: row[col('abs_channels')] || undefined,
      suspension_front: row[col('suspension_front')] || undefined,
      suspension_rear: row[col('suspension_rear')] || undefined,
      digital_cluster_yn: row[col('digital_cluster_yn')] || undefined,
      bluetooth_yn: row[col('bluetooth_yn')] || undefined,
      keyless_start_yn: row[col('keyless_start_yn')] || undefined,
      usb_charging_yn: row[col('usb_charging_yn')] || undefined,
      led_lighting_yn: row[col('led_lighting_yn')] || undefined,
      warranty: row[col('warranty')] || undefined,
    };

    const key = `${brand.toLowerCase()}|${model.toLowerCase()}`;
    specsByBrandModel.set(key, specs);
  }

  console.log(`Loaded specifications for ${specsByBrandModel.size} motorcycles.`);
}

function findSpecs(brand?: string, model?: string): MotorcycleSpecs | undefined {
  if (!brand || !model) return undefined;
  const directKey = `${brand.toLowerCase()}|${model.toLowerCase()}`;
  if (specsByBrandModel.has(directKey)) {
    return specsByBrandModel.get(directKey);
  }

  // Fuzzy match on model prefix
  const bLower = brand.toLowerCase();
  const mLower = model.toLowerCase();
  for (const [k, s] of specsByBrandModel.entries()) {
    if (k.startsWith(`${bLower}|`)) {
      if (mLower.includes(s.model.toLowerCase()) || s.model.toLowerCase().includes(mLower)) {
        return s;
      }
    }
  }
  return undefined;
}

// Load chunks.jsonl
async function loadChunks(): Promise<void> {
  const filePath = path.resolve(process.cwd(), 'chunks.jsonl');
  if (!fs.existsSync(filePath)) {
    console.warn(`chunks.jsonl not found at ${filePath}`);
    return;
  }

  console.log(`Loading chunks from ${filePath}...`);
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const record = JSON.parse(trimmed) as ChunkRecord;
      chunks.push(record);
      chunksById.set(record.chunk_id, record);
    } catch {
      // skip corrupted line
    }
  }

  console.log(`Loaded ${chunks.length} review chunks.`);
  bm25.build(chunks);

  // Build motorcycles list with attached specs
  const seen = new Map<string, MotorcycleBrief>();
  for (const c of chunks) {
    if (c.motorcycle_id && !seen.has(c.motorcycle_id)) {
      const matchedSpecs = findSpecs(c.brand, c.model);
      seen.set(c.motorcycle_id, {
        motorcycle_id: c.motorcycle_id,
        brand: c.brand,
        model: c.model,
        variant: c.variant,
        body_type: matchedSpecs?.body_type || c.body_type,
        ex_showroom_price_inr: matchedSpecs?.ex_showroom_price_inr,
        engine_cc: matchedSpecs?.engine_cc,
        power_bhp: matchedSpecs?.power_bhp,
        mileage_kmpl: matchedSpecs?.mileage_kmpl,
        youtube_url: formatYouTubeEmbedUrl(c.youtube_url),
        specs: matchedSpecs,
      });
    }
  }

  motorcycles = Array.from(seen.values()).sort((a, b) => {
    const brandA = a.brand || '';
    const brandB = b.brand || '';
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    return (a.model || '').localeCompare(b.model || '');
  });

  console.log(`Extracted ${motorcycles.length} unique motorcycle models.`);
}

const SYSTEM_PROMPT = `You are an expert motorcycle journalist and ride tester assistant. Answer the user's question using ONLY the review excerpts provided below - do not use outside knowledge. Each excerpt is numbered.

Guidelines:
1. Provide a sharp, engaging, well-structured answer. Organize by key rider priorities (Engine & Performance, Ergonomics & City/Highway Comfort, Handling & Dynamics, Verdict).
2. When you make a claim, cite the excerpt number(s) in brackets like [1] or [2].
3. Highlight real-world trade-offs (e.g. vibrations at high RPM, heat management in traffic, pillion comfort, suspension firmness).
4. If excerpts are insufficient for specific details, state so clearly.`;

function buildPrompt(question: string, retrieved: ChunkRecord[]): string {
  const blocks = retrieved.map((c, i) => {
    const bike = `${c.brand || ''} ${c.model || ''} ${c.variant || ''}`.trim();
    return `[${i + 1}] (${bike}) ${c.text}`;
  });
  return `Review excerpts:\n\n${blocks.join('\n\n')}\n\nQuestion: ${question}`;
}

async function generateAnswer(question: string, retrieved: ChunkRecord[]): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(question, retrieved)}`;

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
      );
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
      });

      const res = await Promise.race([generatePromise, timeoutPromise]);
      if (res && res.text) return res.text;
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to local synthesis:', err);
    }
  }

  if (openRouterKey) {
    try {
      const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(question, retrieved) },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err) {
      console.error('OpenRouter call failed:', err);
    }
  }

  // Grounded local summary synthesized from retrieved chunks
  const summaries = retrieved.map((c, i) => {
    const bike = `${c.brand || ''} ${c.model || ''}`.trim();
    const cleanSnippet = c.text.length > 240 ? `${c.text.slice(0, 237)}...` : c.text;
    return `• **${bike}** [${i + 1}]: ${cleanSnippet}`;
  });

  return `### Rider Intelligence Summary\n\nBased on reviewer road tests and dyno/ride impressions [1-${retrieved.length}]:\n\n${summaries.join('\n\n')}\n\n*Review takeaways extracted directly from verified test ride transcripts.*`;
}

async function startServer() {
  loadSpecs();
  await loadChunks();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // --- API Routes ---
  const handleHealth = (_req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      chunks_loaded: chunks.length,
      motorcycles_count: motorcycles.length,
      specs_loaded: specsByBrandModel.size,
    });
  };

  app.get('/health', handleHealth);
  app.get('/api/health', handleHealth);

  const handleMotorcycles = (req: express.Request, res: express.Response) => {
    const { category, brand, maxPrice, search } = req.query;
    let list = [...motorcycles];

    if (category && category !== 'All') {
      list = list.filter((m) => m.body_type?.toLowerCase() === String(category).toLowerCase());
    }
    if (brand && brand !== 'All') {
      list = list.filter((m) => m.brand?.toLowerCase() === String(brand).toLowerCase());
    }
    if (maxPrice) {
      const priceCap = Number(maxPrice);
      if (!isNaN(priceCap)) {
        list = list.filter((m) => !m.ex_showroom_price_inr || m.ex_showroom_price_inr <= priceCap);
      }
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (m) =>
          m.brand?.toLowerCase().includes(q) ||
          m.model?.toLowerCase().includes(q) ||
          m.body_type?.toLowerCase().includes(q)
      );
    }

    res.json(list);
  };

  app.get('/motorcycles', handleMotorcycles);
  app.get('/api/motorcycles', handleMotorcycles);

  const handleMotorcycleDetail = (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const bike = motorcycles.find((m) => m.motorcycle_id === id);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }
    // Find associated chunks for this motorcycle
    const bikeChunks = chunks
      .filter((c) => c.motorcycle_id === id)
      .slice(0, 10)
      .map((c) => ({
        chunk_id: c.chunk_id,
        text: c.text,
        youtube_url: formatYouTubeEmbedUrl(c.youtube_url),
      }));

    res.json({
      ...bike,
      chunks: bikeChunks,
    });
  };

  app.get('/motorcycles/:id', handleMotorcycleDetail);
  app.get('/api/motorcycles/:id', handleMotorcycleDetail);

  const handleChunkDetails = (req: express.Request, res: express.Response) => {
    const chunkId = req.params.id;
    const chunk = chunksById.get(chunkId);
    if (!chunk) {
      return res.status(404).json({ error: 'Chunk not found' });
    }
    const specs = findSpecs(chunk.brand, chunk.model);
    const source: Source = {
      chunk_id: chunk.chunk_id,
      motorcycle_id: chunk.motorcycle_id,
      brand: chunk.brand,
      model: chunk.model,
      variant: chunk.variant,
      youtube_url: formatYouTubeEmbedUrl(chunk.youtube_url),
      snippet: chunk.text,
      specs,
    };
    res.json(source);
  };

  app.get('/chunks/:id', handleChunkDetails);
  app.get('/api/chunks/:id', handleChunkDetails);

  const handleAsk = async (req: express.Request, res: express.Response) => {
    try {
      const { question, brand, motorcycle_id, body_type, top_k } = req.body || {};
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'question must not be empty' });
      }

      const k = typeof top_k === 'number' && top_k > 0 ? top_k : 5;
      const retrieved = bm25.search(question.trim(), brand, motorcycle_id, body_type, k);

      if (retrieved.length === 0) {
        return res.json({
          answer: 'No relevant review content was found for that question or filter combination. Try broadening your query or selecting another category.',
          sources: [],
        });
      }

      const answer = await generateAnswer(question, retrieved);
      const sources: Source[] = retrieved.map((c) => {
        const specs = findSpecs(c.brand, c.model);
        return {
          chunk_id: c.chunk_id,
          motorcycle_id: c.motorcycle_id,
          brand: c.brand,
          model: c.model,
          variant: c.variant,
          youtube_url: formatYouTubeEmbedUrl(c.youtube_url),
          snippet: c.text,
          specs,
        };
      });

      res.json({ answer, sources });
    } catch (err: any) {
      console.error('Error in handleAsk:', err);
      res.status(500).json({
        error: 'Failed to process request',
        details: err?.message || 'Server error',
      });
    }
  };

  app.post('/ask', handleAsk);
  app.post('/api/ask', handleAsk);

  // --- Frontend Serving ---
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`MotoRAG server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
