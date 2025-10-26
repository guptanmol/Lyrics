export class GridEngine {
  private grid: string[][] = [];
  private gridOpacity: number[][] = [];
  private activeLetters: Map<string, { char: string; isLyric: boolean }> = new Map();
  private seed: number;
  private rng: () => number;

  readonly GRID_SIZE = 12;
  private readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly VOWELS = 'AEIOU';

  // Layout controls
  private readonly HALO = 1; // padding cells around letters
  private readonly ORIENT_HORIZONTAL_BIAS = 0.6;

  private placedWordCount = 0;
  private lastHorizontal = false;

  constructor(seed: number) {
    this.seed = seed || 1;
    this.rng = this.seededRandom(this.seed);
    this.initializeGrid();
  }

  // ---------- RNG & Init ----------
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  private initializeGrid() {
    this.grid = Array.from({ length: this.GRID_SIZE }, () =>
      Array.from({ length: this.GRID_SIZE }, () => this.getRandomChar())
    );
    this.gridOpacity = Array.from({ length: this.GRID_SIZE }, () =>
      Array.from({ length: this.GRID_SIZE }, () => 0.1 + this.rng() * 0.3)
    );
  }

  private getRandomChar(): string {
    const useVowel = this.rng() < 0.4;
    const src = useVowel ? this.VOWELS : this.ALPHABET;
    return src[Math.floor(this.rng() * src.length)].toLowerCase();
  }

  // ---------- Public API ----------
  getGrid(): string[][] { return this.grid; }

  reset() {
    this.rng = this.seededRandom(this.seed);
    this.activeLetters.clear();
    this.initializeGrid();
    this.placedWordCount = 0;
    this.lastHorizontal = false;
  }

  resetSequence() { this.placedWordCount = 0; }

  updateRandomLetters() {
    for (let r = 0; r < this.GRID_SIZE; r++) {
      for (let c = 0; c < this.GRID_SIZE; c++) {
        const key = `${r}-${c}`;
        if (!this.activeLetters.has(key)) {
          this.grid[r][c] = this.getRandomChar();
          this.gridOpacity[r][c] = 0.1 + this.rng() * 0.3;
        }
      }
    }
  }

  getOpacity(row: number, col: number): number {
    return this.gridOpacity[row][col];
  }

  // ---------- TOKENIZER ----------
  private tokenize(text: string): string[] {
    const norm = text.normalize('NFKC');
    const noApos = norm.replace(/['']/g, '');
    const hyphenToSpace = noApos.replace(/-/g, ' ');
    const cleaned = hyphenToSpace.replace(/[^A-Za-z0-9\s]/g, ' ');
    return cleaned.trim().split(/\s+/).filter(Boolean).map(w => w.toLowerCase());
  }

  // ---------- Helpers for reading order ----------
  private toIndex(r: number, c: number): number {
    return r * this.GRID_SIZE + c;
  }

  private maxExistingIndex(): number {
    let maxIdx = -1;
    for (const key of this.activeLetters.keys()) {
      const [rs, cs] = key.split('-');
      const r = parseInt(rs, 10), c = parseInt(cs, 10);
      if (Number.isFinite(r) && Number.isFinite(c)) {
        const idx = this.toIndex(r, c);
        if (idx > maxIdx) maxIdx = idx;
      }
    }
    return maxIdx;
  }

  private cellIsFreeWithHalo(row: number, col: number, halo: number): boolean {
    for (let rr = row - halo; rr <= row + halo; rr++) {
      for (let cc = col - halo; cc <= col + halo; cc++) {
        if (rr < 0 || cc < 0 || rr >= this.GRID_SIZE || cc >= this.GRID_SIZE) continue;
        if (this.activeLetters.has(`${rr}-${cc}`)) return false;
      }
    }
    return true;
  }

  // ---------- Ordered, distributed placement ----------
  private placeWordAfterIndex(
    word: string,
    minStartIdx: number
  ): { cells: { row: number; col: number }[]; startIdx: number } | null {
    for (const halo of [this.HALO, Math.max(0, this.HALO - 1)]) {
      const maxAttempts = 700;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // choose orientation (bias horizontal, also alternate sometimes)
        let horizontal = this.rng() < this.ORIENT_HORIZONTAL_BIAS;
        if (attempt % 5 === 0) horizontal = !this.lastHorizontal;

        // bounds that leave room for word + halo
        let rowMin = halo, rowMax = this.GRID_SIZE - 1 - halo;
        let colMin = halo, colMax = this.GRID_SIZE - 1 - halo;

        if (horizontal) {
          colMax = this.GRID_SIZE - 1 - halo - (word.length - 1);
          if (colMax < colMin) continue;
        } else {
          rowMax = this.GRID_SIZE - 1 - halo - (word.length - 1);
          if (rowMax < rowMin) continue;
        }

        const r0 = rowMin + Math.floor(this.rng() * (rowMax - rowMin + 1));
        const c0 = colMin + Math.floor(this.rng() * (colMax - colMin + 1));
        const startIdx = this.toIndex(r0, c0);
        if (startIdx <= minStartIdx) continue; // keep reading order strictly increasing

        // collect cells
        const cells: { row: number; col: number }[] = [];
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const r = horizontal ? r0 : r0 + i;
          const c = horizontal ? c0 + i : c0;
          if (!this.cellIsFreeWithHalo(r, c, halo)) { ok = false; break; }
          cells.push({ row: r, col: c });
        }
        if (!ok) continue;

        // commit
        for (let i = 0; i < word.length; i++) {
          const { row, col } = cells[i];
          const key = `${row}-${col}`;
          const ch = word[i];
          this.activeLetters.set(key, { char: ch, isLyric: true });
          this.grid[row][col] = ch;
        }
        this.lastHorizontal = horizontal;
        return { cells, startIdx };
      }
    }
    return null;
  }

  /**
   * Randomly distributes words across the canvas *but* guarantees
   * reading order: each subsequent word starts after the previous one
   * in row-major order.
   */
  placeLyric(
    text: string,
    options: { mode?: 'append' | 'replace' } = {}
  ): { row: number; col: number }[] {
    const { mode = 'append' } = options;
    const allWords = this.tokenize(text);
    if (allWords.length === 0) return [];

    let wordsToPlace: string[];
    if (mode === 'replace') {
      this.activeLetters.clear();
      this.updateRandomLetters();
      this.placedWordCount = 0;
      this.lastHorizontal = false;
      wordsToPlace = allWords;
    } else {
      const start = Math.min(this.placedWordCount, allWords.length);
      wordsToPlace = allWords.slice(start);
    }

    // compute the minimum allowed start index (so new words appear after existing ones)
    let minStartIdx = this.maxExistingIndex();

    const placements: { row: number; col: number }[] = [];
    for (const w of wordsToPlace) {
      const placed = this.placeWordAfterIndex(w, minStartIdx);
      if (!placed) break; // no room left
      placements.push(...placed.cells);
      minStartIdx = placed.startIdx;          // advance the reading-order floor
      this.placedWordCount += 1;
    }
    return placements;
  }

  clearLyrics() {
    this.activeLetters.clear();
    this.updateRandomLetters();
    this.placedWordCount = 0;
    this.lastHorizontal = false;
  }

  isLyricCell(row: number, col: number): boolean {
    return this.activeLetters.has(`${row}-${col}`);
  }
}
