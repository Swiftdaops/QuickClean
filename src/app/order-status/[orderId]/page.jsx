"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";
import { Clock, UserCheck, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { playProductAddedSound } from "@/lib/sound";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const STATUS_ICONS = {
  pending: Clock,
  assigned: UserCheck,
  "in-progress": Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const [status, setStatus] = useState("pending");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting"); // connecting | connected | reconnecting
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [responseTimeLeft, setResponseTimeLeft] = useState(null);

  const badgeClass = useMemo(() => {
    return "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-cyan-100 text-stone-950";
  }, []);
  const StatusIcon = useMemo(() => STATUS_ICONS[status] || Info, [status]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function fetchBooking() {
      setBookingError(null);
      setLoadingBooking(true);
      try {
        const res = await fetch(`${apiBase}/api/bookings/${orderId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || "Failed to load order");
        if (!cancelled) setBooking(data.booking || null);
      } catch (err) {
        if (!cancelled) setBookingError(err.message || String(err));
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    }

    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Initialize status and response timer from booking once loaded
  useEffect(() => {
    if (!booking) return;
    if (booking.status) setStatus(booking.status);

    const createdAtMs = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
    const deadline = createdAtMs + 30 * 60 * 1000; // 30 minutes from creation

    function formatTime(ms) {
      if (ms <= 0) return "0:00";
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function update() {
      const diff = deadline - Date.now();
      setResponseTimeLeft(formatTime(diff));
    }

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  useEffect(() => {
    if (!orderId) return;
    const socket = connectSocket();

    function onConnect() {
      setConnected(true);
      setConnectionState("connected");
      socket.emit("joinOrder", String(orderId));
    }
    function onDisconnect() {
      setConnected(false);
      setConnectionState("reconnecting");
    }
    function onJoined({ orderId: joinedId }) {
      // no-op, but could show toast if desired
    }
    function onStatusUpdate(payload) {
      if (!payload || payload.orderId !== String(orderId)) return;
      if (payload.status) {
        setStatus(payload.status);
        try {
          const human = String(payload.status).replace('-', ' ');
          toast.success(`Order status updated to ${human}`);
          playProductAddedSound("https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3");
        } catch (e) {
          console.debug('Status toast failed', e);
        }
      }
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
        <p className="text-sm text-stone-950">Order ID: <span className="font-mono">{String(orderId)}</span></p>
      </header>

      <section className="space-y-3">
        {booking && !bookingError && !loadingBooking ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-stone-950">Current status:</span>
              <span className={badgeClass}>
                <StatusIcon className="w-4 h-4" />
                <span className="capitalize">{String(status).replace('-', ' ')}</span>
              </span>
            </div>
            <p className="text-xs text-stone-950">
              {connectionState === "connecting" && "Connecting to live feed..."}
              {connectionState === "connected" && "Connected to live feed."}
              {connectionState === "reconnecting" && "Reconnecting to live feed..."}
              {lastUpdate ? ` Last update: ${new Date(lastUpdate).toLocaleString()}` : ""}
            </p>
          </>
        ) : (
          !loadingBooking && (
            <p className="text-sm text-stone-950">
              No active order found. Once you place an order and complete checkout, you can track it here.
            </p>
          )
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Customer & Order Summary</h2>
        {loadingBooking && (
          <p className="text-sm text-stone-950">Loading order details…</p>
        )}
        {bookingError && !loadingBooking && (
          <p className="text-sm text-red-600">{bookingError}</p>
        )}
        {booking && !loadingBooking && !bookingError && (
          <div className="space-y-2 text-sm text-stone-950">
            <p>
              <span className="font-medium">Customer:</span>{" "}
              {booking.customer?.name || "Unknown"}
              {booking.customer?.phone ? ` (${booking.customer.phone})` : ""}
            </p>
            {booking.service && (
              <p>
                <span className="font-medium">Service:</span>{" "}
                {booking.service}
              </p>
            )}
            {booking.orderSummary && (
              <div className="space-y-1">
                <p className="font-medium">Items:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {(booking.orderSummary.items || []).map((item, idx) => (
                    <li key={idx}>
                      {item.name || "Item"}
                      {item.qty ? ` x${item.qty}` : ""}
                      {typeof item.subtotal === "number" && !Number.isNaN(item.subtotal)
                        ? ` — ₦${Number(item.subtotal).toLocaleString("en-NG")}`
                        : ""}
                    </li>
                  ))}
                </ul>
                <p>
                  <span className="font-medium">Total:</span>{" "}
                  ₦{Number(booking.orderSummary.total || 0).toLocaleString("en-NG")}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">What happens next?</h2>
        <ul className="list-disc list-inside text-sm text-stone-950 space-y-1">
          <li>We assign your order to a rider/agent.</li>
          <li>An agent will reach out within 30 minutes to complete your order.</li>
          <li>We keep you posted as it progresses.</li>
          <li>You’ll see updates here in real-time.</li>
        </ul>
        {booking && responseTimeLeft && (
          <p className="text-xs text-stone-950">
            Estimated response time remaining: {responseTimeLeft}.
            {responseTimeLeft === "0:00" && " If no one has reached out yet, please contact us via WhatsApp."}
          </p>
        )}
      </section>
    </main>
  );
}
