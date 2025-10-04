"use client";
import { useEffect, useRef, useState } from "react";

export default function SnapPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e: any) {
        setMsg(e?.message ?? "Camera unavailable");
      }
    })();
    return () => {
      stream?.getTracks()?.forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const v = videoRef.current!,
      c = canvasRef.current!;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 0.92);
    setDataUrl(url);
    setMsg("Captured.");
  }

  async function upload() {
    if (!dataUrl) return;
    setMsg("Uploading…");
    const res = await fetch("/api/snap-upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    const json = await res.json();
    setMsg(
      json.ok
        ? `Uploaded (${json.mode ?? "live"})`
        : `Failed: ${json.error ?? "unknown"}`
    );
  }

  return (
    <main className="space-y-4">
      <h2 className="text-2xl font-semibold">Snap</h2>
      <div className="rounded border p-2">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
      </div>
      <div className="flex gap-3">
        <button onClick={capture} className="underline">
          Capture
        </button>
        <button onClick={upload} className="underline" disabled={!dataUrl}>
          Upload
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl && (
        <img src={dataUrl} alt="capture" className="w-full rounded border" />
      )}
      {msg && <p className="text-sm opacity-75">{msg}</p>}
    </main>
  );
}
