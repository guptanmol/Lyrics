export interface LyricLine {
  text: string;
  timestamp: number;
}

export interface LyricsData {
  lines: LyricLine[];
  duration: number;
}

export async function fetchLyrics(songName: string): Promise<LyricsData | null> {
  try {
    const response = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(songName)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch lyrics');
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return null;
    }

    const song = results[0];

    if (!song.syncedLyrics) {
      if (song.plainLyrics) {
        return parsePlainLyrics(song.plainLyrics);
      }
      return null;
    }

    return parseSyncedLyrics(song.syncedLyrics, song.duration || 0);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
}

function parseSyncedLyrics(syncedLyrics: string, duration: number): LyricsData {
  const lines: LyricLine[] = [];
  const lrcLines = syncedLyrics.split('\n');

  for (const line of lrcLines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();

      if (text) {
        lines.push({
          text,
          timestamp: minutes * 60 * 1000 + seconds * 1000,
        });
      }
    }
  }

  return { lines, duration: duration * 1000 };
}

function parsePlainLyrics(plainLyrics: string): LyricsData {
  const lines: LyricLine[] = [];
  const textLines = plainLyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.match(/^\[.*\]$/));

  textLines.forEach((text, index) => {
    lines.push({
      text,
      timestamp: index * 2000,
    });
  });

  return { lines, duration: textLines.length * 2000 };
}
