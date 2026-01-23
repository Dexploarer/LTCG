"use client";

/**
 * CodeBlock Component
 *
 * Reusable code block with copy functionality.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function CodeBlock({ code, language = "bash", title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative rounded-lg border bg-muted/30 overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Info Box
// =============================================================================

interface InfoBoxProps {
  type: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}

const infoBoxStyles = {
  info: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  warning: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
  error: "bg-red-500/10 border-red-500/50 text-red-400",
  success: "bg-green-500/10 border-green-500/50 text-green-400",
};

const infoBoxIcons = {
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
  success: "✅",
};

export function InfoBox({ type, title, children }: InfoBoxProps) {
  return (
    <div className={cn("p-4 rounded-lg border", infoBoxStyles[type])}>
      <div className="flex items-start gap-2">
        <span>{infoBoxIcons[type]}</span>
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// API Key Display
// =============================================================================

interface ApiKeyDisplayProps {
  prefix: string;
  placeholder?: string;
}

export function ApiKeyDisplay({ prefix, placeholder = "••••••••••••••••" }: ApiKeyDisplayProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg font-mono text-sm">
      <span className="text-muted-foreground">{prefix}</span>
      <span className="text-muted-foreground/50">{placeholder}</span>
    </div>
  );
}
