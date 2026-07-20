const Issue = require("../models/Issue.js");
const { sendNotification } = require("./notification.js");
const { tryGetIO } = require("../config/socket.js");

async function findIssueForReworkOrder(order) {
  if (!order?.isRework) return null;
  if (order.relatedIssue) {
    return Issue.findById(order.relatedIssue);
  }
  return Issue.findOne({ reworkOrder: order._id });
}

/**
 * Keeps Issue status in sync with linked rework Order delivery milestones.
 */
async function syncIssueFromReworkOrder(order) {
  try {
    const issue = await findIssueForReworkOrder(order);
    if (!issue) return;

    const orderStatus = order.status;
    let nextStatus = null;

    if (orderStatus === "fabric-picked-up" && issue.status === "pickup_pending") {
      nextStatus = "pickup_completed";
    }

    if (
      ["fabric-received", "fabric-delivered"].includes(orderStatus) &&
      ["pickup_pending", "pickup_completed"].includes(issue.status)
    ) {
      nextStatus = "rework_in_progress";
    }

    if (
      ["delivered", "order-completed", "product-delivered"].includes(orderStatus) &&
      !["resolved", "closed", "rejected"].includes(issue.status)
    ) {
      nextStatus = "resolved";
    }

    if (!nextStatus || nextStatus === issue.status) return;

    issue.status = nextStatus;
    await issue.save();

    const tailorId = issue.tailor?.toString?.() || issue.tailor;
    const customerId = issue.customer?.toString?.() || issue.customer;
    const io = tryGetIO();
    if (io) {
      if (tailorId) {
        io.to(`user_${tailorId}`).emit("issue_status_updated", {
          issueId: issue._id,
          status: nextStatus,
          issueIdStr: issue.issueId,
        });
      }
      if (customerId) {
        io.to(`user_${customerId}`).emit("issue_status_updated", {
          issueId: issue._id,
          status: nextStatus,
        });
      }
    }

    if (nextStatus === "pickup_completed") {
      await sendNotification({
        recipient: customerId,
        type: "ISSUE_UPDATED",
        title: "Garment picked up",
        message: "Your garment is on the way to the tailor for rework.",
        data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` },
      });
    }

    if (nextStatus === "rework_in_progress") {
      await sendNotification({
        recipient: tailorId,
        type: "ISSUE_UPDATED",
        title: "Ready to start rework",
        message: `Garment received for issue ${issue.issueId}. Complete rework, then assign return delivery.`,
        data: { issueId: issue._id, targetUrl: `/partner/issues/${issue._id}` },
      });
      await sendNotification({
        recipient: customerId,
        type: "ISSUE_UPDATED",
        title: "Rework started",
        message: "Your tailor has received the garment and is working on the fix.",
        data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` },
      });
    }

    if (nextStatus === "resolved") {
      await sendNotification({
        recipient: customerId,
        type: "ISSUE_RESOLVED",
        title: "Issue resolved",
        message: "Your reworked order has been delivered. Thank you for your patience.",
        data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` },
      });
      await sendNotification({
        recipient: tailorId,
        type: "ISSUE_RESOLVED",
        title: "Issue closed",
        message: `Issue ${issue.issueId} is marked resolved after successful return delivery.`,
        data: { issueId: issue._id, targetUrl: `/partner/issues/${issue._id}` },
      });
    }
  } catch (err) {
    console.error("[issueReworkSync] Failed:", err.message);
  }
}

module.exports = { syncIssueFromReworkOrder };
