/**
 * Helpers to classify delivery partner task cards.
 * Active Dispatch must only appear AFTER the partner has accepted.
 */

const toId = (value) => {
  if (!value) return null;
  if (typeof value === "object") return (value._id || value.id || value)?.toString?.() || null;
  return value.toString();
};

export const getPartnerIds = (task, user) => {
  const uid = toId(user?._id || user?.id);
  return {
    uid,
    dpId: toId(task?.deliveryPartner),
    ppId: toId(task?.pickupPartner),
    dopId: toId(task?.dropoffPartner),
  };
};

export const isPickupPhase = (status) =>
  ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(status);

export const isDropoffPhase = (status) =>
  ["ready", "ready-for-pickup", "ready-for-delivery", "out-for-delivery"].includes(status);

/** Broadcast candidate / pending assignment — needs Accept / Reject */
export const isPendingAcceptanceTask = (task, user) => {
  const { uid, dpId, ppId, dopId } = getPartnerIds(task, user);
  if (!uid || !task) return false;

  const isLegacyPending = !!dpId && dpId === uid && task.deliveryStatus === "pending";
  const isPickupPending = !!ppId && ppId === uid && task.pickupDeliveryStatus === "pending";
  const isDropoffPending = !!dopId && dopId === uid && task.dropoffDeliveryStatus === "pending";

  const isCandidate = (task.pendingPartnerCandidates || []).some((id) => toId(id) === uid);
  const isBroadcastPending =
    isCandidate &&
    ((isPickupPhase(task.status) && !ppId) || (isDropoffPhase(task.status) && !dopId));

  return isLegacyPending || isPickupPending || isDropoffPending || isBroadcastPending;
};

const ACTIVE_PARTNER_STATUSES = [
  "accepted",
  "reached-pickup",
  "picked-up",
  "out-for-delivery",
  "reached-dropoff",
];

/** Partner has accepted — safe to show Active Dispatch / execution actions */
export const isAcceptedActiveTask = (task, user) => {
  const { uid, dpId, ppId, dopId } = getPartnerIds(task, user);
  if (!uid || !task) return false;
  if (isPendingAcceptanceTask(task, user)) return false;

  const isLegacyActive =
    !!dpId && dpId === uid && ACTIVE_PARTNER_STATUSES.includes(task.deliveryStatus);
  const isPickupActive =
    !!ppId && ppId === uid && ACTIVE_PARTNER_STATUSES.includes(task.pickupDeliveryStatus);
  const isDropoffActive =
    !!dopId && dopId === uid && ACTIVE_PARTNER_STATUSES.includes(task.dropoffDeliveryStatus);

  return isLegacyActive || isPickupActive || isDropoffActive;
};

/** Granular stage for action buttons — never fall back to order.status alone */
export const getPartnerActionStage = (task, user) => {
  const { uid, ppId, dopId, dpId } = getPartnerIds(task, user);
  if (!task) return null;

  if (ppId && ppId === uid && task.pickupDeliveryStatus) return task.pickupDeliveryStatus;
  if (dopId && dopId === uid && task.dropoffDeliveryStatus) return task.dropoffDeliveryStatus;
  if (dpId && dpId === uid && task.deliveryStatus) return task.deliveryStatus;

  // Not accepted yet — no execution stage
  return null;
};
