const cron = require("node-cron");

let escalationRunning = false;

const initCronJobs = () => {
    // ── Background Cron Jobs ──
    // No automatic re-broadcasts (those stay action-driven). The only background job is the
    // admin escalation: if no delivery partner / measurement executive accepted a request
    // within Admin → Settings → "Alert Admin After (minutes)" (default 10), every admin gets
    // ONE notification per broadcast to assign someone manually.
    cron.schedule("* * * * *", async () => {
        if (escalationRunning) return; // previous run still busy (slow DB) — skip this tick
        escalationRunning = true;
        try {
            const { runAssignmentEscalations } = require("./assignmentEscalation.js");
            await runAssignmentEscalations();
        } catch (err) {
            console.error("⏰ [cron] Assignment escalation failed:", err.message);
        } finally {
            escalationRunning = false;
        }
    });

    console.log("⏰ Cron jobs initialized (admin escalation for unaccepted partner requests: every minute).");
};

module.exports = { initCronJobs };
