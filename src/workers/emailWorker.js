const emailQueue = require("../queues/emailQueue.js");
const transporter = require("../config/mailer.js");

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent to ${to}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email job ${job.id} failed :`, err.message);
});

emailQueue.clean(0, "failed").then(() => {
  console.log("🧹 Cleared failed jobs from queue");
});

console.log("📬 Email worker is running...");
