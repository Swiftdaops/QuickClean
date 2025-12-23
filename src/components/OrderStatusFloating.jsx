"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";
import { Clock, UserCheck, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import ServiceIcon from './ServiceIcon';
import { toast } from "@/components/ui/sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_ICONS = {
  pending: Clock,
  assigned: UserCheck,
  "in-progress": Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function OrderStatusFloating() {
  const pathname = usePathname();
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState(null);
  const [booking, setBooking] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");

  const StatusIcon = useMemo(() => (status && STATUS_ICONS[status]) || Info, [status]);

  // Hide widget on admin routes if desired
  const hidden = pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("quickclean_last_order_id");
      if (stored) setOrderId(stored);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function fetchBooking() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/bookings/${orderId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || "Failed to load order");
        if (!cancelled) {
          setBooking(data.booking || null);
          if (data.booking?.status) setStatus(data.booking.status);
        }
      } catch (err) {
        if (!cancelled) {
          console.debug("Floating status: failed to fetch booking", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const socket = connectSocket();

    function onStatusUpdate(payload) {
      if (!payload || payload.orderId !== String(orderId)) return;
      if (payload.status) {
        setStatus(payload.status);
        try {
          const human = String(payload.status).replace("-", " ");
          toast.success(`Order status updated to ${human}`);
        } catch (e) {
          console.debug("Floating status toast failed", e);
        }
      }
    }

    socket.on("orderStatusUpdate", onStatusUpdate);

    // connection state handlers
    function onConnect() {
      setConnectionState("connected");
    }
    function onDisconnect() {
      setConnectionState("disconnected");
    }
    function onReconnectAttempt() {
      setConnectionState("reconnecting");
    }
    function onConnectError() {
      setConnectionState("disconnected");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      socket.emit("joinOrder", String(orderId));
    } else {
      socket.on("connect", () => {
        socket.emit("joinOrder", String(orderId));
      });
    }

    return () => {
      const s = getSocket();
      try {
        s.emit("leaveOrder", String(orderId));
      } catch {}
      s.off("orderStatusUpdate", onStatusUpdate);
      try {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        s.off("reconnect_attempt", onReconnectAttempt);
        s.off("connect_error", onConnectError);
      } catch (e) {}
    };
  }, [orderId]);

  if (hidden || !orderId) return null;

  const label = status ? status.replace("-", " ") : loading ? "Loading..." : "Order";

  const isNewOrder = booking?.createdAt
    ? (Date.now() - new Date(booking.createdAt).getTime() < 10 * 60 * 1000)
    : false;

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end">
      <div
        className={`transition-all duration-300 transform ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-90"}`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-l-lg rounded-r bg-cyan-100 border text-sm text-stone-950 shadow"
          aria-expanded={open}
        >
          <StatusIcon className="w-4 h-4" />
          <span className="capitalize">{label}</span>
        </button>
      </div>

      {open && booking && (
        <div className="mt-2 w-80 max-w-[90vw] rounded-lg border bg-cyan-100 text-stone-950 shadow-lg p-3 text-xs space-y-2 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="font-semibold">Order summary</div>
              {isNewOrder && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wide">
                  New
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] truncate">#{String(orderId)}</div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    connectionState === 'connected' ? 'bg-emerald-500' : connectionState === 'reconnecting' ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  title={`Hub: ${connectionState}`}
                  aria-hidden
                />
                <span className="text-[11px]">
                  {connectionState === 'connected' ? 'Hub connected' : connectionState === 'reconnecting' ? 'Reconnecting...' : 'Hub disconnected'}
                </span>
              </div>
              {booking?.customer?.name && (
                <div className="text-[11px] mt-1">Connected customer: <span className="font-medium">{booking.customer.name}</span></div>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium">Status:</span>{" "}
            <span className="capitalize">{label}</span>
          </div>
          {booking.customer?.name && (
            <div>
              <span className="font-medium">Customer:</span>{" "}
              {booking.customer.name}
            </div>
          )}
          {booking.orderSummary && (
            <div className="space-y-1">
              <div className="font-medium">Items:</div>
              <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-auto">
                {(booking.orderSummary.items || []).map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name || 'item'} className="w-full h-full object-cover" />
                        ) : (
                          <ServiceIcon name={item.name} className="w-4 h-4 text-stone-900" />
                        )}
                      </div>
                      <div className="truncate text-[13px]">
                        <div className="font-medium">{item.name || 'Item'}</div>
                        <div className="text-[11px] text-stone-700">
                          {item.qty ? `x${item.qty}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-[13px]">{typeof item.subtotal === 'number' && !Number.isNaN(item.subtotal) ? `₦${Number(item.subtotal).toLocaleString('en-NG')}` : ''}</div>
                  </li>
                ))}
              </ul>
              <div>
                <span className="font-medium">Total:</span>{" "}
                ₦{Number(booking.orderSummary.total || 0).toLocaleString("en-NG")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
