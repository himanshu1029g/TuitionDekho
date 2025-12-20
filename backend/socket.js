const { Server } = require("socket.io");
const Message = require("./models/Message");
const CallLog = require("./models/CallLog");
const Notification = require('./models/Notification');

let io;
const userSockets = new Map(); // userId -> socketId

const emitToUser = (userId, event, payload) => {
  try {
    if (!io) return;
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, payload);
    }
  } catch (e) { console.error('emitToUser error', e); }
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔥 Socket connected:", socket.id);

    // ---------------- REGISTER USER ----------------
    socket.on("register", (userId) => {
      socket.userId = userId;
      userSockets.set(userId, socket.id);
      console.log(`✅ User registered ${userId}`);
    });

    // ---------------- CHAT ----------------
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("send_message", async (payload) => {
      try {
        const msg = await Message.create(payload);
        io.to(payload.roomId).emit("receive_message", msg);

        // persist notification so recipients see it even if offline
        try {
          await Notification.create({ userId: payload.recipientId, type: 'message', message: payload.text });
        } catch (e) { console.error('Notification create error:', e); }

        // notify recipient directly (in case they're not currently in the room)
        const recipientSocketId = userSockets.get(payload.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new-message", msg);
        } else {
          // recipient offline — (no socket) they will see persisted notifications when they open header
        }
      } catch (err) {
        console.error("Socket message error:", err.message);
      }
    });

    // ---------------- VIDEO CALL ----------------
    socket.on("start-call", async ({ toUserId, fromUser, roomId }) => {
      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      const log = await CallLog.create({
        fromUser,
        toUserId,
        roomId,
        status: "ringing",
      });

      io.to(targetSocketId).emit("incoming-call", {
        fromUser,
        roomId,
        callLogId: log._id,
      });

      // persist incoming-call notification
      try {
        await Notification.create({ userId: toUserId, type: 'incoming_call', message: `${fromUser?.name} is calling you` });
      } catch (e) { console.error('Notification create error:', e); }

      // Missed call after 30s if not answered
      setTimeout(async () => {
        const updated = await CallLog.findById(log._id);
        if (updated && updated.status === "ringing") {
          updated.status = "missed";
          await updated.save();

          // notify the caller that the call was missed
          const callerSocketId = userSockets.get(fromUser.id);
          if (callerSocketId) {
            io.to(callerSocketId).emit("missed-call", {
              fromUser,
              roomId,
              time: Date.now(),
            });
          }
        }
      }, 30000);
    });

    // Callee accepted the call
    socket.on("call-accepted", async ({ toUserId, roomId }) => {
      try {
        const callerSocketId = userSockets.get(toUserId);
        const log = await CallLog.findOne({ roomId, status: "ringing" }).sort({ createdAt: -1 });
        if (log) {
          log.status = "answered";
          await log.save();
        }
        if (callerSocketId) {
          io.to(callerSocketId).emit("call-accepted", { roomId });
        }
      } catch (err) {
        console.error("call-accepted error:", err);
      }
    });

    // Callee rejected the call
    socket.on("call-rejected", async ({ toUserId, roomId }) => {
      try {
        const callerSocketId = userSockets.get(toUserId);
        const log = await CallLog.findOne({ roomId, status: "ringing" }).sort({ createdAt: -1 });
        if (log) {
          log.status = "rejected";
          await log.save();
        }
        if (callerSocketId) {
          io.to(callerSocketId).emit("call-rejected", { roomId });
        }
      } catch (err) {
        console.error("call-rejected error:", err);
      }
    });

    // Caller cancels the call
    socket.on("cancel-call", async ({ toUserId, roomId, fromUser }) => {
      try {
        const targetSocketId = userSockets.get(toUserId);
        const log = await CallLog.findOne({ roomId, status: "ringing" }).sort({ createdAt: -1 });
        if (log) {
          log.status = "cancelled";
          await log.save();
        }
        if (targetSocketId) {
          io.to(targetSocketId).emit("call-cancelled", { roomId, fromUser });
        }
      } catch (err) {
        console.error("cancel-call error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket, emitToUser };
