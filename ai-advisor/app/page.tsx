"use client";

import { useState, useRef } from "react";

const W = 80; // terminal column width

function row(char = "─") {
  return char.repeat(W);
}

const HELP_TEXT = `=================== SYSTEM HELP & ADVISORY INSTRUCTIONS ===================

1. INQUIRY SUBMISSION:
   Type your gardening question into the INQUIRY INPUT line and press
   [SEND] or hit Enter to process.

2. ADVISORY ENGINE & KNOWLEDGE SOURCES:
   The AI engine evaluates queries specifically for plant & gardening relevance.
   Knowledge models are synthesized from methods by leading YouTube advisors:
   - James Prigioni (Food Forest Permaculture & Soil Biology)
   - Luke Marion / MIgardener (High-Yield Organic & Intensive Gardening)
   - Kevin Espiritu / Epic Gardening (Urban, Container & Raised Bed Systems)

3. SYSTEM CONTROLS:
   - HELP   : Display this instruction manual.
   - CANCEL : Stop an active request or clear input field & system response.`;

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref to hold the current AbortController instance
  const abortControllerRef = useRef<AbortController | null>(null);
  // Ref to track the 5-second timer
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    // Clear any pending 5-second timer if a new request starts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);

    // Instantiate a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
        signal: controller.signal,
      });

      const data = await res.json();
      setResponse(data.response || "ERROR");
    } catch (error: unknown) {
      // Check if the error is due to an abort signal
      if (error instanceof Error && error.name === "AbortError") {
        setResponse("SYS-001: REQUEST CANCELLED BY USER.");

        // Clear existing timer if any
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Reset to default response state after 5 seconds (5000 ms)
        timeoutRef.current = setTimeout(() => {
          setResponse("");
        }, 2000);
      } else {
        setResponse("ERROR: " + (error instanceof Error ? error.message : String(error)));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    // Clear any active timer when user manually triggers cancel
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (loading) {
      // 1. Abort ongoing request (triggers the catch block in handleSubmit)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // 2. Clear input
      setInput("");
    } else {
      // Clear input and response output when idle
      setInput("");
      setResponse("");
    }
  };

  const handleHelp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setResponse(HELP_TEXT);
  };

  return (
    <div
      style={{
        padding: "1rem",
        maxWidth: `${W}ch`,
        margin: "0 auto",
        fontSize: "14px",
        lineHeight: "1.4",
        fontFamily: "monospace",
      }}
    >
      {/* ── Header ── */}
      <pre style={{ margin: 0, color: "#f7fad8" }}>{row("═")}</pre>
      <pre style={{ margin: 0, color: "#f7fad8" }}>
        {"║"} {"AI GARDENING ADVISOR SYSTEM".padEnd(W - 4)} {"║"}
      </pre>
      <pre style={{ margin: 0, color: "#f7fad8" }}>
        {"║"} {"IBM AS/400  -  ADVISORY TERMINAL  V1.0".padEnd(W - 4)} {"║"}
      </pre>
      <pre style={{ margin: 0, color: "#f7fad8" }}>{row("═")}</pre>

      <pre style={{ margin: "0.5rem 0", color: "#f7fad8" }}>
        {`SYSTEM DATE: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}    TIME: ${new Date().toLocaleTimeString("en-US", {
          hour12: false,
        })}    SESSION: ADV001`}
      </pre>

      <pre style={{ margin: 0, color: "#f7fad8" }}>{row()}</pre>

      {/* ── Input section ── */}
      <pre style={{ margin: "0.75rem 0 0.25rem", color: "#f7fad8" }}>
        INQUIRY INPUT:
      </pre>

      <form onSubmit={(e) => handleSubmit(e)} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ color: "#f7fad8", whiteSpace: "nowrap" }}>{"> "}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER QUERY..."
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #f7fad8",
            color: "#f7fad8",
            fontFamily: "inherit",
            fontSize: "inherit",
            outline: "none",
            padding: "2px 4px",
            caretColor: "#f7fad8",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#cd8fe9" : "#f7fad8",
            color: "#2b0443",
            border: "none",
            fontFamily: "inherit",
            fontSize: "inherit",
            fontWeight: "bold",
            padding: "2px 12px",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {loading ? "PROCESSING" : "SEND"}
        </button>
      </form>

      <pre style={{ margin: "0.75rem 0 0", color: "#f7fad8" }}>{row()}</pre>

      {/* ── Response section ── */}
      <pre style={{ margin: "0.25rem 0", color: "#f7fad8" }}>
        SYSTEM RESPONSE:
      </pre>

      <div
        style={{
          minHeight: "12rem",
          border: "1px solid #f7fad8",
          padding: "0.5rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: loading ? "#cd8fe9" : "#f7fad8",
        }}
      >
        {loading
          ? "*** PROCESSING REQUEST — PLEASE WAIT ***"
          : response || "** NO OUTPUT — SUBMIT AN INQUIRY TO BEGIN **"}
      </div>

      {/* ── Function key bar ── */}
      <pre style={{ margin: "0.75rem 0 0", color: "#f7fad8" }}>{row("═")}</pre>

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          background: "transparent",
          color: "#f7fad8",
          padding: "4px 0",
          fontSize: "13px",
        }}
      >
        <button
          type="button"
          onClick={handleHelp}
          style={{
            background: "none",
            border: "none",
            color: "#f7fad8",
            cursor: "pointer",
            font: "inherit",
            fontWeight: "bold",
            padding: 0,
            letterSpacing: "0.05em",
          }}
        >
          [ HELP ]
        </button>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "none",
            border: "none",
            color: "#f7fad8",
            cursor: "pointer",
            font: "inherit",
            fontWeight: "bold",
            padding: 0,
            letterSpacing: "0.05em",
          }}
        >
          [ CANCEL ]
        </button>
      </div>

      <pre style={{ margin: 0, color: "#f7fad8" }}>{row("═")}</pre>
    </div>
  );
}
