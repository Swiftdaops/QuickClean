"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const [status, setStatus] = useState("pending");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  const badgeClass = useMemo(() => {
    const cls = STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
    return `inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${cls}`;
  }, [status]);

  useEffect(() => {
    if (!orderId) return;
    const socket = connectSocket();

    function onConnect() {
      setConnected(true);
      socket.emit("joinOrder", String(orderId));
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onJoined({ orderId: joinedId }) {
      // no-op, but could show toast if desired
    }
    function onStatusUpdate(payload) {
      if (!payload || payload.orderId !== String(orderId)) return;
      if (payload.status) setStatus(payload.status);
      if (payload.updatedAt) setLastUpdate(payload.updatedAt);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("joinedOrder", onJoined);
    socket.on("orderStatusUpdate", onStatusUpdate);

    if (socket.connected) onConnect();

    return () => {
      const s = getSocket();
      try { s.emit("leaveOrder", String(orderId)); } catch {}
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("joinedOrder", onJoined);
      s.off("orderStatusUpdate", onStatusUpdate);
    };
  }, [orderId]);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Order Status</h1>
        <p className="text-sm text-gray-600">Order ID: <span className="font-mono">{String(orderId)}</span></p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-700">Current status:</span>
          <span className={badgeClass}>{status}</span>
        </div>
        <p className="text-xs text-gray-500">
          {connected ? "Connected to live updates." : "Reconnecting to live updates..."}
          {lastUpdate ? ` Last update: ${new Date(lastUpdate).toLocaleString()}` : ""}
        </p>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">What happens next?</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>We assign your order to a rider/agent.</li>
          <li>We keep you posted as it progresses.</li>
          <li>You’ll see updates here in real-time.</li>
        </ul>
      </section>
    </main>
  );
}
