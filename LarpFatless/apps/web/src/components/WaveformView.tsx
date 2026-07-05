import { useEffect, useRef } from "react";

interface WaveformViewProps {
  analyser?: AnalyserNode | null;
  active: boolean;
}

export function WaveformView({ analyser, active }: WaveformViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !active) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(data);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 3;
      context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-accent-start").trim();
      context.beginPath();

      data.forEach((value, index) => {
        const x = (index / data.length) * canvas.width;
        const y = (value / 255) * canvas.height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });

      context.stroke();
    };

    draw();

    return () => cancelAnimationFrame(frame);
  }, [active, analyser]);

  return <canvas className="waveform" ref={canvasRef} width={360} height={96} aria-hidden="true" />;
}
