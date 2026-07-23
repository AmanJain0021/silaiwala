/** Walk-in production pipeline — kept separate from online Order statuses */

const OFFLINE_PIPELINE_STEPS = [
  { value: "accepted", label: "Accepted" },
  { value: "cutting", label: "Cutting" },
  { value: "stitching", label: "Stitching" },
  { value: "fitting", label: "Fitting" },
  { value: "finishing", label: "Finishing" },
  { value: "ready", label: "Ready for Handoff" },
  { value: "delivered", label: "Delivered" },
];

const LEGACY_STATUS_ALIASES = {
  pending: "accepted",
  in_progress: "stitching",
};

const TERMINAL_STATUSES = ["delivered", "cancelled"];

const ALL_OFFLINE_ORDER_STATUSES = [
  ...OFFLINE_PIPELINE_STEPS.map((s) => s.value),
  "cancelled",
  "pending",
  "in_progress",
];

const formatStatusLabel = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeOfflineStatus = (status) => LEGACY_STATUS_ALIASES[status] || status;

const getOfflineStatusLabel = (status) => {
  if (status === "cancelled") return "Cancelled";
  const normalized = normalizeOfflineStatus(status);
  const step = OFFLINE_PIPELINE_STEPS.find((s) => s.value === normalized);
  if (step) return step.label;
  return formatStatusLabel(status);
};

const isAllowedOfflineStatus = (status) => ALL_OFFLINE_ORDER_STATUSES.includes(status);

/** DB filter: include legacy rows when filtering a pipeline step */
const statusFilterValues = (status) => {
  if (!status) return null;
  if (status === "active") return { $nin: TERMINAL_STATUSES };
  if (status === "accepted") return ["accepted", "pending"];
  if (status === "stitching") return ["stitching", "in_progress"];
  return [status];
};

const buildPipelineCounts = (byStatusRows = []) => {
  const counts = Object.fromEntries(
    [...OFFLINE_PIPELINE_STEPS.map((s) => s.value), "cancelled"].map((k) => [k, 0])
  );
  byStatusRows.forEach((row) => {
    const raw = row._id;
    const n = row.count || 0;
    if (raw === "cancelled") {
      counts.cancelled += n;
      return;
    }
    if (raw === "delivered") {
      counts.delivered += n;
      return;
    }
    const bucket = normalizeOfflineStatus(raw);
    if (counts[bucket] !== undefined) counts[bucket] += n;
  });
  return counts;
};

const pipelineStepIndex = (status) => {
  if (status === "cancelled") return -1;
  const normalized = normalizeOfflineStatus(status);
  return OFFLINE_PIPELINE_STEPS.findIndex((s) => s.value === normalized);
};

module.exports = {
  OFFLINE_PIPELINE_STEPS,
  ALL_OFFLINE_ORDER_STATUSES,
  TERMINAL_STATUSES,
  normalizeOfflineStatus,
  getOfflineStatusLabel,
  isAllowedOfflineStatus,
  statusFilterValues,
  buildPipelineCounts,
  pipelineStepIndex,
};
