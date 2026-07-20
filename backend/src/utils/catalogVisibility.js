/** Customer-facing catalog: approved products only (legacy docs without status still visible). */
const PUBLIC_PRODUCT_FILTER = {
  isActive: true,
  $or: [{ status: "approved" }, { status: { $exists: false } }],
};

/** Customer-facing services */
const PUBLIC_SERVICE_FILTER = {
  isActive: true,
  $or: [{ status: "approved" }, { status: { $exists: false } }],
};

module.exports = { PUBLIC_PRODUCT_FILTER, PUBLIC_SERVICE_FILTER };
