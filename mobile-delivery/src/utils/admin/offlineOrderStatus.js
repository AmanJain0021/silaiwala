export const OFFLINE_PIPELINE_STEPS = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'cutting', label: 'Cutting' },
  { value: 'stitching', label: 'Stitching' },
  { value: 'fitting', label: 'Fitting' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'ready', label: 'Ready for Handoff' },
  { value: 'delivered', label: 'Delivered' },
];

const LEGACY_MAP = {
  pending: 'accepted',
  in_progress: 'stitching',
};

export const normalizeOfflineStatus = (status) => LEGACY_MAP[status] || status;

export const getOfflineStatusLabel = (status) => {
  if (status === 'cancelled') return 'Cancelled';
  const normalized = normalizeOfflineStatus(status);
  const step = OFFLINE_PIPELINE_STEPS.find((s) => s.value === normalized);
  if (step) return step.label;
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const pipelineStepIndex = (status) => {
  if (status === 'cancelled') return -1;
  const normalized = normalizeOfflineStatus(status);
  return OFFLINE_PIPELINE_STEPS.findIndex((s) => s.value === normalized);
};

export const OFFLINE_STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'In Production' },
  ...OFFLINE_PIPELINE_STEPS.map((s) => ({ key: s.value, label: s.label })),
  { key: 'cancelled', label: 'Cancelled' },
];

export const offlineStatusStyle = (status) => {
  const n = normalizeOfflineStatus(status);
  switch (n) {
    case 'delivered':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'ready':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'finishing':
    case 'fitting':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'stitching':
    case 'cutting':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'accepted':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
