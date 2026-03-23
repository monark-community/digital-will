import { createServer as createHttpServer, Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import {
  NotificationType,
  NotificationRecipientRole,
  UserNotification,
} from "../substreams/interfaces/cleaned/model";
import { getNotificationsForUser } from "../services/notificationService";
import { generateUserNotification } from "../utils/userNotificationGenerator";

// ─── State ────────────────────────────────────────────────────────────────────

let io: SocketServer | null = null;

/** Maps userId → set of active socket IDs (supports multiple tabs / devices). */
const userSockets = new Map<string, Set<string>>();

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initGateway(httpServer: HttpServer): void {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.websocket.corsOrigin,
      credentials: true,
    },
  });

  // JWT authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, config.jwt.secret) as {
        userId: string;
      };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId: string = socket.data.userId;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    console.log(
      `[WS] User ${userId} connected (socket ${socket.id}) — ${userSockets.get(userId)!.size} active socket(s)`,
    );

    socket.on(
      "get_notifications",
      async (callback: (data: unknown) => void) => {
        const rows = await getNotificationsForUser(userId);
        const notifications = rows.map((n) => {
          const willName = n.will?.willName ?? "";
          const pmUserId = n.will?.wallet?.user?.userId;
          const role =
            pmUserId === userId
              ? NotificationRecipientRole.PM
              : NotificationRecipientRole.SM;
          const contentData = JSON.parse(n.content);
          const notifType = contentData.type as NotificationType;
          const { title, message } = generateUserNotification(
            notifType,
            willName,
            role,
          );
          return {
            id: n.notifId,
            type: notifType,
            role,
            title,
            message,
            willId: n.willId,
            willName,
            read: n.readStatus,
            createdAt: new Date().toISOString(),
          };
        });
        callback(notifications);
      },
    );

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      console.log(`[WS] User ${userId} disconnected (socket ${socket.id})`);
    });
  });

  console.log(
    `[WS] Gateway initialized (CORS origin: ${config.websocket.corsOrigin})`,
  );
}

// ─── Emit ─────────────────────────────────────────────────────────────────────

export function emitUserNotification(
  userId: string,
  notification: UserNotification,
): void {
  if (!io) {
    console.warn("[WS] Gateway not initialized — cannot emit notification");
    return;
  }
  const sockets = userSockets.get(userId);
  if (!sockets?.size) return;

  for (const socketId of sockets) {
    io.to(socketId).emit("notification", notification);
  }
}

export { createHttpServer };
