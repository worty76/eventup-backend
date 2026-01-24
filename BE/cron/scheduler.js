const cron = require("node-cron");
const {
  autoCompleteEvents,
  sendCompletionReminders,
  sendPreEventReminders,
} = require("../controllers/applicationController");

const initCronJobs = () => {
  console.log("Initializing Cron Jobs...");

  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running auto-complete events job...");
    await autoCompleteEvents();
  });

  // Run every hour to send completion reminders
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running completion reminder job...");
    await sendCompletionReminders();
  });

  // Run every 10 minutes to send pre-event reminders
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Cron] Running pre-event reminder job...");
    await sendPreEventReminders();
  });
};

module.exports = { initCronJobs };
