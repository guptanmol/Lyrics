export class LyricScheduler {
  private lyrics: string[];
  private currentIndex: number = 0;
  private pacingMode: 'line' | 'word' | 'token';
  private speed: number;
  private startTime: number = 0;

  constructor(rawLyrics: string, pacingMode: 'line' | 'word' | 'token' = 'line', speed: number = 1) {
    this.lyrics = this.parseLyrics(rawLyrics);
    this.pacingMode = pacingMode;
    this.speed = speed;
  }

  private parseLyrics(raw: string): string[] {
    const cleaned = raw
      .replace(/\[.*?\]/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    if (this.pacingMode === 'line') {
      return cleaned.split('\n').filter(line => line.trim());
    } else if (this.pacingMode === 'word') {
      return cleaned.split(/\s+/).filter(word => word.trim());
    } else {
      const tokens: string[] = [];
      let current = '';
      for (const char of cleaned.replace(/\n/g, ' ')) {
        if (char === ' ' && current.length >= 7) {
          tokens.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current) tokens.push(current.trim());
      return tokens;
    }
  }

  getDuration(): number {
    switch (this.pacingMode) {
      case 'line':
        return 1800 / this.speed;
      case 'word':
        return 750 / this.speed;
      case 'token':
        return 450 / this.speed;
      default:
        return 1800 / this.speed;
    }
  }

  getCurrentLyric(timestamp: number): string | null {
    if (this.lyrics.length === 0) return null;

    const duration = this.getDuration();
    const elapsed = timestamp - this.startTime;
    const index = Math.floor(elapsed / duration);

    if (index !== this.currentIndex && index < this.lyrics.length) {
      this.currentIndex = index;
    }

    if (this.currentIndex >= this.lyrics.length) {
      return null;
    }

    return this.lyrics[this.currentIndex];
  }

  restart() {
    this.currentIndex = 0;
    this.startTime = 0;
  }

  setStartTime(time: number) {
    this.startTime = time;
  }

  isComplete(timestamp: number): boolean {
    const duration = this.getDuration();
    const elapsed = timestamp - this.startTime;
    const index = Math.floor(elapsed / duration);
    return index >= this.lyrics.length;
  }

  getTotalDuration(): number {
    return this.lyrics.length * this.getDuration();
  }
}
