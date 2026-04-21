require("dotenv").config();
const validateEnv = require("./src/config/validateEnv");
validateEnv();
const http = require("http");
const { initSocket } = require("./src/socket/socket.service.js");
const app = require("./src/app.js");

require("./src/workers/emailWorker.js");

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
