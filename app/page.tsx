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

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:\"])/g, "\\$1");
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<"text" | "wifi">("text");
  const [input, setInput] = useState("www.example.com");
  const [networkName, setNetworkName] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [size, setSize] = useState<number>(320);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const normalized = useMemo(() => normalizeInput(input), [input]);

  async function generate() {
    const value = mode === "wifi"
      ? networkName.trim()
        ? `WIFI:T:${security};S:${escapeWifiValue(networkName.trim())};P:${escapeWifiValue(password)};H:${hidden};;`
        : ""
      : normalized.value;

    if (!value) {
      setDataUrl("");
      setStatus(mode === "wifi" ? "Enter a network name first." : "Type something first.");
      return;
    }

    if (mode === "text" && looksLikeUrl(value) && !isValidHttpUrl(value)) {
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
          light: "#ffffff",       // Solid quiet zone for light and dark themes
        },
      });

      setDataUrl(canvas.toDataURL("image/png"));
      setStatus(mode === "wifi" ? "Wi-Fi QR generated." : normalized.warning ? `Generated. (${normalized.warning})` : "Generated.");
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
    <main className="app-page p-6 font-sans min-h-screen">
      <div className="text-2xl font-black">QR Code Generator</div>

      <div className="app-tabs mt-6 inline-flex gap-1 rounded-xl p-1" role="tablist" aria-label="QR code type">
        <button
          role="tab"
          aria-selected={mode === "text"}
          onClick={() => setMode("text")}
          className={`app-tab rounded-lg px-4 py-2 text-sm font-bold cursor-pointer ${mode === "text" ? "active" : ""}`}
        >
          Text or URL
        </button>
        <button
          role="tab"
          aria-selected={mode === "wifi"}
          onClick={() => setMode("wifi")}
          className={`app-tab rounded-lg px-4 py-2 text-sm font-bold cursor-pointer ${mode === "wifi" ? "active" : ""}`}
        >
          Wi-Fi login
        </button>
      </div>

      <div className="mt-6 max-w-2xl grid gap-4">
        {mode === "text" ? (
          <div className="theme-panel p-3.5 border rounded-2xl">
            <div className="font-black mb-2">Text or URL</div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="theme-input w-full p-3 rounded-xl border text-base"
            />
            {normalized.value && normalized.value !== input.trim() && (
              <div className="theme-muted mt-2 text-sm">Using: {normalized.value}</div>
            )}
          </div>
        ) : (
          <div className="theme-panel p-3.5 border rounded-2xl grid gap-3">
            <div className="font-black mb-1">Wi-Fi network</div>
            <label className="grid gap-1 text-sm font-semibold" htmlFor="network-name">
              Network name (SSID)
              <input id="network-name" value={networkName} onChange={(e) => setNetworkName(e.target.value)} placeholder="e.g. Guest Wi-Fi" className="theme-input w-full p-3 rounded-xl border text-base font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold" htmlFor="wifi-password">
              Password
              <input id="wifi-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Network password" className="theme-input w-full p-3 rounded-xl border text-base font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold" htmlFor="security">
              Security
              <select id="security" value={security} onChange={(e) => setSecurity(e.target.value)} className="theme-input w-full p-3 rounded-xl border text-base font-normal">
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
              Hidden network
            </label>
          </div>
        )}

        <div className="theme-panel p-3.5 border rounded-2xl">
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
            className="theme-button px-3.5 py-2.5 rounded-xl border font-black cursor-pointer"
          >
            Generate
          </button>

          <button
            onClick={download}
            disabled={!dataUrl}
            className="theme-button px-3.5 py-2.5 rounded-xl border font-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PNG
          </button>

          <span className="theme-muted text-sm">{status}</span>
        </div>

        <div
          className="theme-preview grid place-items-center rounded-2xl border p-3.5"
          style={{ width: Math.min(size + 40, 820) }}
        >
          <canvas ref={canvasRef} width={size} height={size} className="hidden" />
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" width={size} height={size} />
          ) : (
            <div className="theme-muted">No QR generated yet</div>
          )}
        </div>
      </div>
    </main>
  );
}
