const logger = require("./logger");

const required = [
  "PORT",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET_KEY",
  "JWT_EXPIRES_IN",
  "REDIS_HOST",
  "REDIS_PORT",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USER",
  "MAIL_PASS",
  "MAIL_FROM",
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  //   if (missing.length > 0) {
  //     console.error(`❌ Missing required environment variables:`);
  //     missing.forEach((key) => console.error(`   - ${key}`));
  //     process.exit(1); // crash immediately with clear message
  //   }

  //   console.log("✅ Environment variables validated");

  if (missing.length > 0) {
    logger.error("Missing required environment variables", {
      missing,
    });

    // Give Winston time to flush logs before exit
    setTimeout(() => process.exit(1), 500);
  } else {
    logger.info("Environment variables validated");
  }
};

module.exports = validateEnv;
