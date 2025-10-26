import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { GridEngine } from './engine/GridEngine';
import { LyricScheduler } from './engine/LyricScheduler';
import { TimestampScheduler } from './engine/TimestampScheduler';
import { GridCanvas } from './components/GridCanvas';
import { ControlBar } from './components/ControlBar';
import { fetchLyrics, LyricsData } from './services/lyricsApi';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pacingMode, setPacingMode] = useState<'line' | 'word' | 'token'>('line');
  const [seed, setSeed] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [usingTimestamps, setUsingTimestamps] = useState(false);
  const [fetchedLyrics, setFetchedLyrics] = useState<LyricsData | null>(null);

  const gridEngineRef = useRef<GridEngine | null>(null);
  const schedulerRef = useRef<LyricScheduler | TimestampScheduler | null>(null);

  useEffect(() => {
    gridEngineRef.current = new GridEngine(seed);

    if (usingTimestamps && fetchedLyrics) {
      schedulerRef.current = new TimestampScheduler(fetchedLyrics.lines);
    } else {
      schedulerRef.current = new LyricScheduler(lyrics, pacingMode, speed);
    }
  }, [seed, lyrics, pacingMode, speed, usingTimestamps, fetchedLyrics]);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setIsLoading(true);
    const data = await fetchLyrics(searchInput);
    setIsLoading(false);

    if (data) {
      setFetchedLyrics(data);
      setUsingTimestamps(true);
      const plainText = data.lines.map(l => l.text).join('\n');
      setLyrics(plainText);
    } else {
      alert('Could not find synced lyrics. Please paste lyrics manually.');
      setUsingTimestamps(false);
    }
  };

  const handleManualLyrics = () => {
    setUsingTimestamps(false);
    setFetchedLyrics(null);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    schedulerRef.current?.restart();
    gridEngineRef.current?.reset();
  };

  const handleRandomize = () => {
    setSeed(Date.now());
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'monospace' }}>
            OBSCURA
          </h1>
          <p className="text-cyan-400/60 text-sm" style={{ fontFamily: 'monospace' }}>
            Matrix-style Lyrics Video Generator
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-black border border-cyan-400/30 rounded px-4 py-3 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-400/60"
              placeholder="Search song name (e.g., 'Artist - Song Title')..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ fontFamily: 'monospace' }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-6 py-3 rounded transition-colors font-mono text-sm disabled:opacity-50"
            >
              <Search size={18} />
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {usingTimestamps && (
            <div className="text-cyan-400/70 text-xs font-mono flex items-center justify-between">
              <span>Using synced lyrics with timestamps</span>
              <button
                onClick={handleManualLyrics}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Switch to manual mode
              </button>
            </div>
          )}

          <textarea
            className="w-full bg-black border border-cyan-400/30 rounded p-4 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-400/60 resize-none"
            placeholder="Or paste lyrics manually..."
            rows={4}
            value={lyrics}
            onChange={(e) => {
              setLyrics(e.target.value);
              handleManualLyrics();
            }}
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <GridCanvas
          gridEngine={gridEngineRef.current}
          scheduler={schedulerRef.current}
          isPlaying={isPlaying}
        />

        <ControlBar
          isPlaying={isPlaying}
          speed={speed}
          pacingMode={pacingMode}
          usingTimestamps={usingTimestamps}
          onPlayPause={handlePlayPause}
          onRestart={handleRestart}
          onRandomize={handleRandomize}
          onSpeedChange={setSpeed}
          onPacingChange={setPacingMode}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

export default App;
