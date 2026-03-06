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
    <main style={{ padding: 24, fontFamily: "system-ui", background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ fontSize: 24, fontWeight: 900 }}>QR Code Generator</div>

      <div style={{ marginTop: 24, maxWidth: 800, display: "grid", gap: 16 }}>
        <div style={{ padding: 14, border: "1px solid #e2e8f0", borderRadius: 14, background: "#f8fafc" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Text or URL</div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 16,
            }}
          />
          {normalized.value && normalized.value !== input.trim() && (
            <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
              Using: {normalized.value}
            </div>
          )}
        </div>

        <div style={{ padding: 14, border: "1px solid #e2e8f0", borderRadius: 14, background: "#f8fafc" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Size</div>
          <input
            type="range"
            min={128}
            max={768}
            step={16}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <div style={{ marginTop: 8 }}>{size}px</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={generate}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Generate
          </button>

          <button
            onClick={download}
            disabled={!dataUrl}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontWeight: 900,
              cursor: dataUrl ? "pointer" : "not-allowed",
              opacity: dataUrl ? 1 : 0.5,
            }}
          >
            Download PNG
          </button>

          <span style={{ fontSize: 14, color: "#475569" }}>{status}</span>
        </div>

        <div
          style={{
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#ffffff",   // solid white
            padding: 14,
            width: Math.min(size + 40, 820),
          }}
        >
          <canvas ref={canvasRef} width={size} height={size} style={{ display: "none" }} />
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" width={size} height={size} />
          ) : (
            <div style={{ color: "#475569" }}>No QR generated yet</div>
          )}
        </div>
      </div>
    </main>
  );
}
