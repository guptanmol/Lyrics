import { useRef, useEffect, useState } from 'react';
import { GridEngine } from '../engine/GridEngine';
import { LyricScheduler } from '../engine/LyricScheduler';
import { TimestampScheduler } from '../engine/TimestampScheduler';

interface GridCanvasProps {
  gridEngine: GridEngine | null;
  scheduler: LyricScheduler | TimestampScheduler | null;
  isPlaying: boolean;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({ gridEngine, scheduler, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const [currentLyric, setCurrentLyric] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridEngine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = 1080;
    canvas.width = SIZE;
    canvas.height = SIZE;

    const CELL_SIZE = SIZE / gridEngine.GRID_SIZE;
    const FONT_SIZE = Math.floor(CELL_SIZE * 0.6);
    let lastRandomUpdate = 0;

    const render = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        scheduler?.setStartTime(timestamp);
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, SIZE, SIZE);

      if (isPlaying && scheduler) {
        const lyric = scheduler.getCurrentLyric(timestamp);

        if (lyric !== currentLyric) {
          setCurrentLyric(lyric);
          gridEngine.clearLyrics();
          if (lyric) {
            gridEngine.placeLyric(lyric);
          }
        }
      }

      if (timestamp - lastRandomUpdate >= 500) {
        gridEngine.updateRandomLetters();
        lastRandomUpdate = timestamp;
      }
      const grid = gridEngine.getGrid();

      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let row = 0; row < gridEngine.GRID_SIZE; row++) {
        for (let col = 0; col < gridEngine.GRID_SIZE; col++) {
          const char = grid[row][col];
          const x = col * CELL_SIZE + CELL_SIZE / 2;
          const y = row * CELL_SIZE + CELL_SIZE / 2;

          const jitterX = gridEngine.isLyricCell(row, col) ? 0 : (Math.random() - 0.5) * 2;
          const jitterY = gridEngine.isLyricCell(row, col) ? 0 : (Math.random() - 0.5) * 2;

          if (gridEngine.isLyricCell(row, col)) {
            ctx.shadowColor = '#BFE3FF';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#BFE3FF';
            ctx.globalAlpha = 1.0;
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#BFE3FF';
            ctx.globalAlpha = gridEngine.getOpacity(row, col);
          }

          ctx.fillText(char, x + jitterX, y + jitterY);
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      if (isPlaying && scheduler && !scheduler.isComplete(timestamp)) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render);
    } else {
      render(startTimeRef.current || 0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gridEngine, scheduler, isPlaying, currentLyric]);

  useEffect(() => {
    if (!isPlaying) {
      startTimeRef.current = 0;
    }
  }, [isPlaying]);

  return (
    <div className="flex justify-center items-center bg-black rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto border border-cyan-400/20 rounded"
        style={{ maxHeight: '70vh', aspectRatio: '1/1' }}
      />
    </div>
  );
};
