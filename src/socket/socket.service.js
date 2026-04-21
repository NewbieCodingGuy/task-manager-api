const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.userId;
      socket.email = decoded.email;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.userId} connected via Websocket`);

    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

module.exports = { initSocket, getIO };
