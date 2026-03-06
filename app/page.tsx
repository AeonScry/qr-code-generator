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
  const [darkColor, setDarkColor] = useState("#111827");

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
          dark: darkColor,
          light: "#00000000", // transparent background
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
    <main className="page">
      <style>{`
        .page {
          padding: 24px;
          font-family: system-ui;
          background: #ffffff;
          color: #0f172a;
          min-height: 100vh;
        }

        .card {
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
        }

        .row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .title {
          font-size: 24px;
          font-weight: 900;
        }

        .sub {
          margin-top: 8px;
          color: #475569;
        }

        .grid {
          margin-top: 16px;
          display: grid;
          gap: 16px;
          max-width: 800px;
        }

        label {
          display: block;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .text {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 16px;
        }

        input[type="range"],
        input[type="color"] {
          padding: 10px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          font-weight: 900;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .muted {
          color: #475569;
          font-size: 14px;
        }

        .previewWrap {
          display: grid;
          place-items: center;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background:
            linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%) 0 0 / 20px 20px,
            linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%) 10px 10px / 20px 20px,
            #f8fafc;
          padding: 14px;
        }
      `}</style>

      <div>
        <div className="title">QR Code Generator</div>
        <div className="sub">
          Transparent PNG • Margin 0 • Error correction fixed to H
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <label>Text or URL</label>
          <input
            className="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {normalized.value && normalized.value !== input.trim() && (
            <div className="muted" style={{ marginTop: 8 }}>
              Using: {normalized.value}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Options</div>

          <div className="row" style={{ marginBottom: 10 }}>
            <div style={{ minWidth: 140, fontWeight: 900 }}>Size</div>
            <input
              type="range"
              min={128}
              max={768}
              step={16}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <div style={{ width: 70 }}>{size}px</div>
          </div>

          <div className="row">
            <div style={{ minWidth: 140, fontWeight: 900 }}>Foreground</div>
            <input
              type="color"
              value={darkColor}
              onChange={(e) => setDarkColor(e.target.value)}
            />
            <span className="muted">background is transparent</span>
          </div>
        </div>

        <div className="row">
          <button className="btn" onClick={generate}>Generate</button>
          <button className="btn" onClick={download} disabled={!dataUrl}>
            Download PNG
          </button>
          <span className="muted">{status || " "}</span>
        </div>

        <div className="previewWrap" style={{ width: Math.min(size + 40, 820) }}>
          <canvas ref={canvasRef} width={size} height={size} style={{ display: "none" }} />
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" width={size} height={size} />
          ) : (
            <div className="muted">No QR generated yet</div>
          )}
        </div>
      </div>
    </main>
  );
}