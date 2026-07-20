const Settings = require("../models/Settings.js");
const { getDistanceFromLatLonInKm } = require("./haversine.js");
const Tailor = require("../models/Tailor.js");
const { resolvePickupStartCoords, coordsFromLocation } = require("./resolveDeliveryCoords.js");
const Customer = require("../models/Customer.js");

/**
 * Platform delivery fee from distance (same formula as checkout price-summary).
 */
async function feeFromDistanceKm(distanceKm) {
  const settings = await Settings.getSettings();
  const deliveryRates = settings.deliveryRates || { baseFee: 20, perKmRate: 10 };
  const km = Math.max(0, Number(distanceKm) || 0);
  const deliveryFee =
    km > 0
      ? Math.round(deliveryRates.baseFee + km * deliveryRates.perKmRate)
      : Math.round(deliveryRates.baseFee);

  return {
    distanceKm: Math.round(km * 100) / 100,
    deliveryFee,
    baseFee: deliveryRates.baseFee,
    perKmRate: deliveryRates.perKmRate,
  };
}

/**
 * @param {'pickup'|'dropoff'} cycle — pickup: customer→tailor, dropoff: tailor→customer
 */
async function calculateOrderLegFee(order, cycle = "pickup") {
  let startCoords = null;
  let endCoords = null;
  let customerDoc = null;

  if (order.customer) {
    customerDoc = await Customer.findOne({
      user: order.customer._id || order.customer,
    }).lean();
  }

  const tailorProfile = await Tailor.findOne({
    user: order.tailor._id || order.tailor,
  }).lean();

  if (cycle === "pickup") {
    startCoords = resolvePickupStartCoords(order, customerDoc);
    endCoords = coordsFromLocation(tailorProfile?.location);
  } else {
    startCoords = coordsFromLocation(tailorProfile?.location);
    endCoords = resolvePickupStartCoords(order, customerDoc);
  }

  let distanceKm = 0;
  if (
    startCoords?.length >= 2 &&
    endCoords?.length >= 2
  ) {
    distanceKm = getDistanceFromLatLonInKm(
      startCoords[1],
      startCoords[0],
      endCoords[1],
      endCoords[0]
    );
  }

  const fee = await feeFromDistanceKm(distanceKm);
  return { ...fee, cycle, hasCoords: !!(startCoords && endCoords) };
}

module.exports = {
  feeFromDistanceKm,
  calculateOrderLegFee,
};
