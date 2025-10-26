import { Play, Pause, RotateCcw, Download, Shuffle } from 'lucide-react';

interface ControlBarProps {
  isPlaying: boolean;
  speed: number;
  pacingMode: 'line' | 'word' | 'token';
  usingTimestamps: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onRandomize: () => void;
  onSpeedChange: (speed: number) => void;
  onPacingChange: (mode: 'line' | 'word' | 'token') => void;
  onExport: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  speed,
  pacingMode,
  usingTimestamps,
  onPlayPause,
  onRestart,
  onRandomize,
  onSpeedChange,
  onPacingChange,
  onExport,
}) => {
  return (
    <div className="bg-black border border-cyan-400/30 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <button
          onClick={onPlayPause}
          className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-4 py-2 rounded transition-colors font-mono text-sm"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onRestart}
          className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-4 py-2 rounded transition-colors font-mono text-sm"
        >
          <RotateCcw size={18} />
          Restart
        </button>

        <button
          onClick={onRandomize}
          className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-4 py-2 rounded transition-colors font-mono text-sm"
        >
          <Shuffle size={18} />
          Randomize
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-4 py-2 rounded transition-colors font-mono text-sm"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {!usingTimestamps && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-cyan-400 text-sm font-mono block">
              Speed: {speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-cyan-400/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-cyan-400 text-sm font-mono block">
              Pacing Mode
            </label>
            <select
              value={pacingMode}
              onChange={(e) => onPacingChange(e.target.value as 'line' | 'word' | 'token')}
              className="w-full bg-black border border-cyan-400/30 text-cyan-400 px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-cyan-400/60"
            >
              <option value="line">Line (1.8s)</option>
              <option value="word">Word (0.75s)</option>
              <option value="token">Token (0.45s)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
