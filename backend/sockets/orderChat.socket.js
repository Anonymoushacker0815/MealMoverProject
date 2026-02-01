import jwt from "jsonwebtoken";
import { config } from "../config.js";

const JWT_SECRET = config.JWT_SECRET;

const mapDbStatusToUiStatus = (dbStatus) => {
  switch (dbStatus) {
    case "placed":
      return "new";
    case "preparing":
      return "preparing";
    case "delivering":
      return "ready";
    case "completed":
      return "complete";
    case "rejected":
      return "rejected";
    default:
      return "new";
  }
};

export function registerOrderChatSocket(io, pool) {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!token) return next(new Error("No token"));

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return next(new Error("Invalid token"));
      socket.data.user = user;
      next();
    });
  });

  const getRestaurantIdForUser = async (userId) => {
    const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1", [userId]);
    return r.rows.length ? r.rows[0].id : null;
  };

  const getOrderAccessInfo = async (orderId) => {
    const q = `
      SELECT o.id, o.customer_id, o.restaurant_id, os.name AS status_name
      FROM orders o
      JOIN o_status os ON os.id = o.status_id
      WHERE o.id = $1
      LIMIT 1;
    `;
    const r = await pool.query(q, [Number(orderId)]);
    return r.rows.length ? r.rows[0] : null;
  };

  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id, socket.data.user?.id);

    socket.on("order:join", async (payload, cb) => {
      try {
        const orderId = Number(payload?.orderId);
        if (!Number.isFinite(orderId)) return cb?.({ ok: false, error: "Invalid orderId" });

        const user = socket.data.user;
        const order = await getOrderAccessInfo(orderId);
        if (!order) return cb?.({ ok: false, error: "Order not found" });

        if (user.user_type === "Customer") {
          if (Number(order.customer_id) !== Number(user.id)) {
            return cb?.({ ok: false, error: "Forbidden" });
          }
        } else if (user.user_type === "Restaurant" || user.user_type === "Admin") {
          if (user.user_type !== "Admin") {
            const restaurantId = await getRestaurantIdForUser(user.id);
            if (!restaurantId || Number(order.restaurant_id) !== Number(restaurantId)) {
              return cb?.({ ok: false, error: "Forbidden" });
            }
          }
        } else {
          return cb?.({ ok: false, error: "Forbidden" });
        }

        socket.join(`order:${orderId}`);

        socket.emit("order:status", {
          orderId,
          status: mapDbStatusToUiStatus(order.status_name),
          updatedAt: new Date().toISOString(),
        });

        cb?.({ ok: true });
      } catch (e) {
        console.error("[socket] order:join error", e);
        cb?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("chat:send", async (payload, cb) => {
      try {
        const orderId = Number(payload?.orderId);
        const text = String(payload?.text ?? "").trim();
        if (!Number.isFinite(orderId)) return cb?.({ ok: false, error: "Invalid orderId" });
        if (!text) return cb?.({ ok: false, error: "Empty message" });

        const user = socket.data.user;
        const order = await getOrderAccessInfo(orderId);
        if (!order) return cb?.({ ok: false, error: "Order not found" });

        if (order.status_name === "placed" || order.status_name === "rejected") {
          return cb?.({ ok: false, error: "Chat not available yet" });
        }

        if (user.user_type === "Customer") {
          if (Number(order.customer_id) !== Number(user.id)) {
            return cb?.({ ok: false, error: "Forbidden" });
          }
        } else if (user.user_type === "Restaurant" || user.user_type === "Admin") {
          if (user.user_type !== "Admin") {
            const restaurantId = await getRestaurantIdForUser(user.id);
            if (!restaurantId || Number(order.restaurant_id) !== Number(restaurantId)) {
              return cb?.({ ok: false, error: "Forbidden" });
            }
          }
        } else {
          return cb?.({ ok: false, error: "Forbidden" });
        }

        const msg = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          orderId,
          senderId: user.id,
          senderType: user.user_type,
          text,
          createdAt: new Date().toISOString(),
        };

        io.to(`order:${orderId}`).emit("chat:new", msg);
        cb?.({ ok: true });
      } catch (e) {
        console.error("[socket] chat:send error", e);
        cb?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected:", socket.id);
    });
  });
}
