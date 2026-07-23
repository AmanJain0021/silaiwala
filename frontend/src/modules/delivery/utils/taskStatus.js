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

  if (task.isOffline) {
    return task.deliveryPartnerStatus === "requested";
  }

  const isLegacyPending = !!dpId && dpId === uid && ["pending", "assigned"].includes(task.deliveryStatus);
  const isPickupPending =
    !!ppId && ppId === uid && ["pending", "assigned"].includes(task.pickupDeliveryStatus);
  const isDropoffPending =
    !!dopId && dopId === uid && ["pending", "assigned"].includes(task.dropoffDeliveryStatus);

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
  "fabric-picked-up",
  "out-for-delivery",
  "reached-dropoff",
];

/** Partner has accepted — safe to show Active Dispatch / execution actions */
export const isAcceptedActiveTask = (task, user) => {
  const { uid, dpId, ppId, dopId } = getPartnerIds(task, user);
  if (!uid || !task) return false;
  if (isPendingAcceptanceTask(task, user)) return false;

  if (task.isOffline) {
    return task.deliveryPartnerStatus === "accepted" && task.status !== "delivered";
  }

  // Still on an active fabric / final delivery job assigned to this partner
  const assignedToMe =
    (ppId && ppId === uid) || (dopId && dopId === uid) || (dpId && dpId === uid);
  if (
    assignedToMe &&
    ["fabric-ready-for-pickup", "fabric-picked-up", "out-for-delivery", "ready-for-delivery", "ready-for-pickup"].includes(
      task.status
    )
  ) {
    const stage = task.pickupDeliveryStatus || task.dropoffDeliveryStatus || task.deliveryStatus;
    if (stage && stage !== "pending" && stage !== "delivered") return true;
  }

  const isLegacyActive =
    !!dpId && dpId === uid && ACTIVE_PARTNER_STATUSES.includes(task.deliveryStatus);
  const isPickupActive =
    !!ppId && ppId === uid && ACTIVE_PARTNER_STATUSES.includes(task.pickupDeliveryStatus);
  const isDropoffActive =
    !!dopId && dopId === uid && ACTIVE_PARTNER_STATUSES.includes(task.dropoffDeliveryStatus);

  return isLegacyActive || isPickupActive || isDropoffActive;
};

/**
 * Granular stage for action buttons.
 * Syncs order.status when partner-phase status lags (fixes stuck "Confirm Picked Up").
 */
export const getPartnerActionStage = (task, user) => {
  const { uid, ppId, dopId, dpId } = getPartnerIds(task, user);
  if (!task) return null;

  if (task.isOffline) {
    if (task.deliveryPartnerStatus === "requested") return "pending";
    if (task.deliveryPartnerStatus === "accepted") return "accepted";
    return task.status;
  }

  let stage = null;
  if (ppId && ppId === uid && task.pickupDeliveryStatus) stage = task.pickupDeliveryStatus;
  else if (dopId && dopId === uid && task.dropoffDeliveryStatus) stage = task.dropoffDeliveryStatus;
  else if (dpId && dpId === uid && task.deliveryStatus) stage = task.deliveryStatus;

  // Fabric already picked from customer → next step is tailor drop-off
  if (task.status === "fabric-picked-up") {
    if (stage === "reached-dropoff") return "reached-dropoff";
    if (stage === "delivered") return "delivered";
    // Stuck at reached-pickup / accepted / picked-up → advance UI to fabric-picked-up
    return "fabric-picked-up";
  }

  if (task.status === "fabric-received" || task.status === "fabric-delivered") {
    return "delivered";
  }

  if (task.status === "out-for-delivery" && (!stage || stage === "accepted" || stage === "picked-up")) {
    return stage === "reached-dropoff" ? "reached-dropoff" : stage || "picked-up";
  }

  // Normalize alias
  if (stage === "picked-up" && task.taskType === "fabric-pickup") {
    return "fabric-picked-up";
  }

  return stage;
};
