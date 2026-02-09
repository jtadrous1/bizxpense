"use client";

import { useCallback, useEffect, useState } from "react";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { formatDate } from "@/lib/utils";

interface PlaidAccount {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}

interface PlaidItem {
  id: string;
  institutionName: string | null;
  lastSynced: string | null;
  createdAt: string;
  accounts: PlaidAccount[];
}

export default function AccountsPage() {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/plaid/accounts");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      console.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncResult(
        `Synced ${data.synced} new transaction${data.synced !== 1 ? "s" : ""}` +
          (data.modified ? `, ${data.modified} updated` : "") +
          (data.removed ? `, ${data.removed} removed` : "")
      );
      fetchAccounts(); // Refresh last synced time
    } catch (err: unknown) {
      setSyncResult(
        err instanceof Error ? err.message : "Sync failed"
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (itemId: string) => {
    if (!confirm("Disconnect this account? Existing synced expenses will remain.")) return;
    try {
      await fetch(`/api/plaid/accounts/${itemId}`, { method: "DELETE" });
      fetchAccounts();
    } catch {
      console.error("Failed to disconnect");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Link your bank or credit card to automatically import transactions as expenses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
          <PlaidLinkButton onSuccess={fetchAccounts} />
        </div>
      </div>

      {/* Sync result message */}
      {syncResult && (
        <div className="px-4 py-3 rounded-lg bg-brand-50 text-brand-700 text-sm">
          {syncResult}
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No accounts connected
          </h3>
          <p className="text-gray-500 mb-6">
            Connect your Amex or other bank cards to automatically import transactions.
          </p>
          <PlaidLinkButton onSuccess={fetchAccounts} />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.institutionName || "Connected Institution"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Connected {formatDate(item.createdAt)}
                    {item.lastSynced && (
                      <> &middot; Last synced {formatDate(item.lastSynced)}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(item.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>

              {/* Account chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {item.accounts.map((acct) => (
                  <div
                    key={acct.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {acct.officialName || acct.name}
                    </span>
                    {acct.mask && (
                      <span className="text-xs text-gray-400">
                        ••••{acct.mask}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 capitalize">
                      {acct.subtype || acct.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Click &quot;Connect Bank / Card&quot; and sign into your institution through Plaid&apos;s secure portal.</li>
          <li>Click &quot;Sync Now&quot; to pull in the latest transactions as expenses.</li>
          <li>Synced expenses appear in your Expenses page — you can add categories and notes.</li>
          <li>Duplicate transactions are automatically prevented.</li>
        </ul>
      </div>
    </div>
  );
}
