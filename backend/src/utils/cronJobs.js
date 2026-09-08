const initCronJobs = () => {
    // ── Background Cron Jobs ──
    // Notification & assignment triggers are strictly action-driven by user/tailor/admin clicks
    // to prevent unwanted automated alerts or unexpected background rebroadcasts.
    console.log('⏰ Cron jobs initialized (Notification triggers set to action-driven mode).');
};

module.exports = { initCronJobs };
