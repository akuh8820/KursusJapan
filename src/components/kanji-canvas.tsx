"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getStrokeData } from "@/lib/stroke/stroke-data";
import { drawPath } from "@/lib/stroke/svg-path";

type KanjiCanvasProps = {
  char: string;
  label?: string;
  onResult?: (correct: boolean) => void;
  showShadow?: boolean;
  height?: number;
};

type Stroke = { points: { x: number; y: number }[] };
type StrokeData = {
  char: string;
  source: "kana" | "kanji";
  viewBox: string;
  strokes: { i: number; d: string }[];
};

export default function KanjiCanvas({
  char,
  label,
  onResult,
  showShadow = true,
  height = 260,
}: KanjiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userStrokes, setUserStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    let mounted = true;
    const reset = () => {
      setLoading(true);
      setError(false);
      setStrokeData(null);
      setUserStrokes([]);
      setCurrentStroke(null);
      setShowResult(false);
    };
    reset();

    getStrokeData(char).then((data) => {
      if (!mounted) return;
      if (data) {
        setStrokeData(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [char]);

  useEffect(() => {
    const updateDpr = () => {
      setDpr(window.devicePixelRatio || 1);
    };
    updateDpr();
    window.addEventListener("resize", updateDpr);
    return () => window.removeEventListener("resize", updateDpr);
  }, []);

  const getTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !strokeData) return { scale: 1, offsetX: 0, offsetY: 0 };

    const [, , vbWidth, vbHeight] = strokeData.viewBox.split(" ").map(Number);
    const scaleX = canvas.width / vbWidth;
    const scaleY = canvas.height / vbHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const offsetX = (canvas.width - vbWidth * scale) / 2;
    const offsetY = (canvas.height - vbHeight * scale) / 2;
    return { scale, offsetX, offsetY };
  }, [strokeData]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { scale, offsetX, offsetY } = getTransform();

    if (showShadow && strokeData) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.strokeStyle = "rgba(100, 100, 100, 0.35)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokeData.strokes) {
        ctx.beginPath();
        drawPath(ctx, stroke.d);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 9;

    for (const stroke of userStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (currentStroke && currentStroke.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [userStrokes, currentStroke, strokeData, showShadow, getTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [dpr, height, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    },
    [dpr]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (showResult) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      const pt = getCanvasPoint(e);
      setCurrentStroke([pt]);
    },
    [getCanvasPoint, showResult]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!currentStroke || showResult) return;
      const pt = getCanvasPoint(e);
      setCurrentStroke((prev) => (prev ? [...prev, pt] : null));
    },
    [currentStroke, getCanvasPoint, showResult]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!currentStroke || showResult) return;
      const canvas = canvasRef.current;
      if (canvas) canvas.releasePointerCapture(e.pointerId);
      if (currentStroke.length >= 2) {
        setUserStrokes((prev) => [...prev, { points: currentStroke }]);
      }
      setCurrentStroke(null);
    },
    [currentStroke, showResult]
  );

  const clearCanvas = useCallback(() => {
    setUserStrokes([]);
    setCurrentStroke(null);
    setShowResult(false);
  }, []);

  const undoStroke = useCallback(() => {
    setUserStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleCorrect = useCallback(() => {
    setShowResult(true);
    onResult?.(true);
  }, [onResult]);

  const handleRetry = useCallback(() => {
    setShowResult(true);
    onResult?.(false);
    setTimeout(() => {
      clearCanvas();
      setShowResult(false);
    }, 150);
  }, [onResult, clearCanvas]);

  if (loading) {
    return (
      <div
        ref={containerRef}
        className="rounded-2xl border border-border bg-card p-4"
        style={{ height, minHeight: height }}
      >
        <div className="h-full flex items-center justify-center text-muted">
          Memuat huruf…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {label && (
        <p className="mb-2 text-sm font-medium text-muted">{label}</p>
      )}

      <div ref={containerRef} className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {!showResult ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={undoStroke}
            disabled={userStrokes.length === 0 && !currentStroke}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={userStrokes.length === 0 && !currentStroke}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span
              className="text-6xl font-bold select-none"
              style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
            >
              {char}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition active:scale-[0.99]"
            >
              Ulangi ⟳
            </button>
            <button
              type="button"
              onClick={handleCorrect}
              className="flex-1 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition active:scale-[0.99]"
            >
              Mirip ✓
            </button>
          </div>
        </div>
      )}

      {error && !strokeData && (
        <p className="mt-2 text-center text-sm text-muted">
          Data stroke tidak tersedia. Gunakan huruf sebagai referensi.
        </p>
      )}
    </div>
  );
}