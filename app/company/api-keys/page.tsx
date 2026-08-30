"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function loadKeys() {
    try {
      const res = await fetch("/api/company/api-keys");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to load API keys.");
        return;
      }
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      setError("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadKeys(); }, []);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setCreatedKey(null);
    try {
      const res = await fetch("/api/company/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create key."); return; }
      setCreatedKey(data.key);
      setNewKeyName("");
      await loadKeys();
    } catch {
      setError("Failed to create key.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? Any integrations using it will stop working immediately.")) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/company/api-keys?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to revoke key."); return; }
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      setError("Failed to revoke key.");
    } finally {
      setRevoking(null);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <CorporateAppShell currentPath="/company/api-keys">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
            <p className="mt-1 text-sm text-gray-400">
              Authenticate your ATS integration.{" "}
              <Link href="/api-docs" className="text-purple-300 hover:text-purple-200">
                View API docs →
              </Link>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* New key revealed — show once */}
        {createdKey && (
          <div className="mb-6 rounded-2xl border border-green-400/30 bg-green-500/10 p-5">
            <p className="mb-2 text-sm font-bold text-green-300">
              Key created. Copy it now, as you won&apos;t see it again.
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 overflow-x-auto rounded-lg bg-black/40 px-4 py-3 text-sm text-green-200">
                {createdKey}
              </code>
              <button
                onClick={() => copyKey(createdKey)}
                className="shrink-0 rounded-lg border border-green-400/30 px-4 py-3 text-sm font-bold text-green-300 hover:bg-green-500/10"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-300"
            >
              I&apos;ve saved it, dismiss
            </button>
          </div>
        )}

        {/* Create form */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
            Create new key
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              aria-label="API key name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              placeholder="e.g. Greenhouse integration"
              className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              onClick={createKey}
              disabled={creating || !newKeyName.trim()}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-on-accent transition hover:bg-purple-500 disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">Only admins can create and revoke keys.</p>
        </div>

        {/* Key list */}
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
            Active keys
          </h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : keys.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center text-sm text-gray-400">
              No active API keys. Create one above to start integrating.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-bold">{key.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-400">
                      {key.keyPrefix}••••••••••••••••••••••••••••••
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Created {new Date(key.createdAt).toLocaleDateString("en-GB")}
                      {key.lastUsedAt
                        ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString("en-GB")}`
                        : " · Never used"}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeKey(key.id)}
                    disabled={revoking === key.id}
                    className="ml-4 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                  >
                    {revoking === key.id ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-gray-400">
          <p className="font-bold text-gray-300 mb-1">Security notice</p>
          Keys are shown only once. Store them in your ATS secret manager.
          Revoke immediately if a key is exposed. Each key is scoped to your company only.
        </div>
      </div>
    </CorporateAppShell>
  );
}
