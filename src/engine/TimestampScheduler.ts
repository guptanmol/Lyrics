import { LyricLine } from '../services/lyricsApi';

export class TimestampScheduler {
  private lines: LyricLine[];
  private currentIndex: number = 0;
  private startTime: number = 0;

  constructor(lines: LyricLine[]) {
    this.lines = lines;
  }

  getCurrentLyric(timestamp: number): string | null {
    if (this.lines.length === 0) return null;

    const elapsed = timestamp - this.startTime;

    for (let i = this.lines.length - 1; i >= 0; i--) {
      if (elapsed >= this.lines[i].timestamp) {
        if (i !== this.currentIndex) {
          this.currentIndex = i;
        }
        return this.lines[i].text;
      }
    }

    return null;
  }

  restart() {
    this.currentIndex = 0;
    this.startTime = 0;
  }

  setStartTime(time: number) {
    this.startTime = time;
  }

  isComplete(timestamp: number): boolean {
    if (this.lines.length === 0) return true;
    const elapsed = timestamp - this.startTime;
    const lastLine = this.lines[this.lines.length - 1];
    return elapsed > lastLine.timestamp + 3000;
  }

  getTotalDuration(): number {
    if (this.lines.length === 0) return 0;
    const lastLine = this.lines[this.lines.length - 1];
    return lastLine.timestamp + 3000;
  }

  getLines(): LyricLine[] {
    return this.lines;
  }
}
