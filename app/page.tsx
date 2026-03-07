"use client";

import { useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

function normalizeInput(raw: string): { value: string; warning?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: "" };

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return { value: trimmed };

  if (/^www\./i.test(trimmed)) {
    return { value: `https://${trimmed}`, warning: "Added https:// to www. URL" };
  }

  const looksLikeDomain =
    /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed) && !/\s/.test(trimmed);

  if (looksLikeDomain) {
    return { value: `https://${trimmed}`, warning: "Assumed https:// for domain-like input" };
  }

  return { value: trimmed };
}

function looksLikeUrl(value: string) {
  return /^(https?:\/\/)/i.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [input, setInput] = useState("www.example.com");
  const [size, setSize] = useState<number>(320);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const normalized = useMemo(() => normalizeInput(input), [input]);

  async function generate() {
    const value = normalized.value;

    if (!value) {
      setDataUrl("");
      setStatus("Type something first.");
      return;
    }

    if (looksLikeUrl(value) && !isValidHttpUrl(value)) {
      setDataUrl("");
      setStatus("That looks like a URL but isn't valid.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setStatus("Generating...");

      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 0,
        errorCorrectionLevel: "H",
        color: {
          dark: "#000000",        // Fixed black foreground
          light: "#00000000",     // Transparent background
        },
      });

      setDataUrl(canvas.toDataURL("image/png"));
      setStatus(normalized.warning ? `Generated. (${normalized.warning})` : "Generated.");
    } catch (err) {
      console.error(err);
      setDataUrl("");
      setStatus("Failed to generate QR code.");
    }
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr.png";
    a.click();
  }

  return (
    <main className="p-6 font-sans bg-white min-h-screen">
      <div className="text-2xl font-black">QR Code Generator</div>

      <div className="mt-6 max-w-2xl grid gap-4">
        <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
          <div className="font-black mb-2">Text or URL</div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-base"
          />
          {normalized.value && normalized.value !== input.trim() && (
            <div className="mt-2 text-sm text-slate-600">
              Using: {normalized.value}
            </div>
          )}
        </div>

        <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
          <div className="font-black mb-2">Size</div>
          <input
            type="range"
            min={128}
            max={768}
            step={16}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-2">{size}px</div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={generate}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-black cursor-pointer"
          >
            Generate
          </button>

          <button
            onClick={download}
            disabled={!dataUrl}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PNG
          </button>

          <span className="text-sm text-slate-600">{status}</span>
        </div>

        <div
          className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-3.5"
          style={{ width: Math.min(size + 40, 820) }}
        >
          <canvas ref={canvasRef} width={size} height={size} className="hidden" />
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" width={size} height={size} />
          ) : (
            <div className="text-slate-600">No QR generated yet</div>
          )}
        </div>
      </div>
    </main>
  );
}
