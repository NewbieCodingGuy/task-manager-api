require("dotenv").config();

const app = require("./src/app.js");

require("./src/workers/emailWorker.js");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
