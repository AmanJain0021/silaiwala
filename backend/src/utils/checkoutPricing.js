const mongoose = require("mongoose");
const { getDistanceFromLatLonInKm } = require("./haversine.js");

/**
 * Same formula customer is charged for home measurement visit (Admin → visitFee).
 * Executive payout must use this (locked on order at create).
 */
function computeVisitFee(distanceKm, visitSettings = {}) {
  const baseFee = Number(visitSettings.baseFee) || 0;
  const perKmFee = Number(visitSettings.perKmFee) || 0;
  const freeKm = Number(visitSettings.freeKm) || 0;
  const km = Math.max(0, Number(distanceKm) || 0);

  if (baseFee <= 0 && perKmFee <= 0) return 0;
  if (km <= freeKm) return Math.round(baseFee);
  return Math.round(baseFee + (km - freeKm) * perKmFee);
}

/**
 * Single source of truth for checkout totals (matches Bill Details on customer app).
 */
function computeCheckoutPricing(items, deliveryAddress, isCartCheckout, settings) {
  const visitSettings = settings.visitFee || { baseFee: 150, perKmFee: 20, freeKm: 3 };
  const deliveryRates = settings.deliveryRates || { baseFee: 20, perKmRate: 10 };
  const platformFeePercentage = settings.walletConfig?.platformFeePercentage ?? 5;
  const gstPercentage = settings.pricing?.gstPercentage ?? 5;
  const freeDeliveryMinOrder =
    settings.pricing?.freeDeliveryMinOrder != null
      ? Number(settings.pricing.freeDeliveryMinOrder)
      : 999;

  let totalBase = 0;
  let totalAddons = 0;
  let totalFabric = 0;
  let totalTailorAtHome = 0;
  let orderDeliveryFee = 0;
  let freeDeliveryApplied = false;
  let actualDeliveryCost = 0; // what delivery partners should earn (never zeroed by free-delivery promo)
  let pickupDeliveryCost = 0;
  let dropoffDeliveryCost = 0;

  let uLat = null;
  let uLng = null;
  if (deliveryAddress?.location?.coordinates?.length >= 2) {
    uLng = deliveryAddress.location.coordinates[0];
    uLat = deliveryAddress.location.coordinates[1];
  }

  if (isCartCheckout) {
    totalBase = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    const firstItem = items[0];
    let distanceKm = 0;
    let tLat = null;
    let tLng = null;

    if (firstItem?.tailor?.location?.coordinates?.length >= 2) {
      tLng = firstItem.tailor.location.coordinates[0];
      tLat = firstItem.tailor.location.coordinates[1];
    }

    orderDeliveryFee = Number(deliveryRates.baseFee) || 0;
    if (uLat != null && uLng != null && tLat != null && tLng != null) {
      distanceKm = getDistanceFromLatLonInKm(uLat, uLng, tLat, tLng);
      if (distanceKm > 0) {
        orderDeliveryFee = Math.round(
          Number(deliveryRates.baseFee) + distanceKm * Number(deliveryRates.perKmRate)
        );
      }
    }
    actualDeliveryCost = orderDeliveryFee;
    dropoffDeliveryCost = orderDeliveryFee;

    // Free delivery for customer when merchandise meets threshold (partner cost still tracked)
    if (freeDeliveryMinOrder > 0 && totalBase >= freeDeliveryMinOrder) {
      orderDeliveryFee = 0;
      freeDeliveryApplied = true;
    }
  } else {
    let pickupTrips = 0;
    let deliveryTrips = 0;
    let maxDistanceKm = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemBase = Number(item.pricing?.base) || 0;
      const itemAddons = Number(item.pricing?.addons) || 0;
      const itemFabric = Number(item.pricing?.fabric) || 0;
      let dynamicTailorAtHome = Number(item.pricing?.tailorAtHome) || 0;

      let distanceKm = 0;
      let tLat = null;
      let tLng = null;

      if (item.serviceDetails?.tailorCoordinates?.length >= 2) {
        tLng = item.serviceDetails.tailorCoordinates[0];
        tLat = item.serviceDetails.tailorCoordinates[1];
      }

      if (uLat != null && uLng != null && tLat != null && tLng != null) {
        distanceKm = getDistanceFromLatLonInKm(uLat, uLng, tLat, tLng);
        if (distanceKm > maxDistanceKm) maxDistanceKm = distanceKm;

        if (item.configuration?.isTailorAtHome) {
          dynamicTailorAtHome = computeVisitFee(distanceKm, visitSettings);
        }
      }

      totalBase += itemBase;
      totalAddons += itemAddons;
      totalFabric += itemFabric;
      totalTailorAtHome += dynamicTailorAtHome;

      if (item.configuration?.fabricSource === "customer") {
        pickupTrips = 1;
      }

      if (item.configuration?.deliveryType && item.configuration.deliveryType !== "self") {
        deliveryTrips = 1;
      }
    }

    const totalTrips = pickupTrips + deliveryTrips;

    if (totalTrips > 0) {
      const perTrip =
        maxDistanceKm > 0
          ? Math.round(
              Number(deliveryRates.baseFee) + maxDistanceKm * Number(deliveryRates.perKmRate)
            )
          : Math.round(Number(deliveryRates.baseFee) || 0);
      if (pickupTrips > 0) pickupDeliveryCost = perTrip * pickupTrips;
      if (deliveryTrips > 0) dropoffDeliveryCost = perTrip * deliveryTrips;
      actualDeliveryCost = pickupDeliveryCost + dropoffDeliveryCost;
      orderDeliveryFee = actualDeliveryCost;
    }

    const merchandiseSubtotal = totalBase + totalAddons + totalFabric + totalTailorAtHome;
    if (freeDeliveryMinOrder > 0 && merchandiseSubtotal >= freeDeliveryMinOrder) {
      orderDeliveryFee = 0;
      freeDeliveryApplied = true;
    }
  }

  // Platform fee on stitching + style addons only (not fabric / visit / delivery / GST)
  const platformFeeAmount = Math.round(
    (totalBase + totalAddons) * (platformFeePercentage / 100)
  );
  const taxableAmount =
    totalBase + totalAddons + totalFabric + totalTailorAtHome + platformFeeAmount;
  const totalTaxes = Math.round(taxableAmount * (gstPercentage / 100));

  // Grand total customer pays (delivery fee may be 0 if free-delivery promo)
  const finalTotal = Math.round(
    totalBase +
      totalAddons +
      totalFabric +
      totalTailorAtHome +
      platformFeeAmount +
      totalTaxes +
      orderDeliveryFee
  );

  // Sanity: components must recombine to total
  const recomposed =
    Math.round(totalBase) +
    Math.round(totalAddons) +
    Math.round(totalFabric) +
    Math.round(totalTailorAtHome) +
    platformFeeAmount +
    totalTaxes +
    Math.round(orderDeliveryFee);
  if (recomposed !== finalTotal) {
    console.warn(
      `[checkoutPricing] recompose mismatch: recomposed=${recomposed} finalTotal=${finalTotal}`
    );
  }

  return {
    total: finalTotal,
    base: Math.round(totalBase),
    taxes: totalTaxes,
    delivery: Math.round(orderDeliveryFee),
    actualDeliveryCost: Math.round(actualDeliveryCost),
    pickupDeliveryCost: Math.round(pickupDeliveryCost),
    dropoffDeliveryCost: Math.round(dropoffDeliveryCost),
    addons: Math.round(totalAddons),
    fabric: Math.round(totalFabric),
    tailorAtHome: Math.round(totalTailorAtHome),
    platformFee: platformFeeAmount,
    platformFeePercentage,
    gstPercentage,
    subtotalBeforeTax: Math.round(taxableAmount),
    freeDeliveryApplied,
    freeDeliveryMinOrder,
  };
}

/**
 * Build checkout-shaped items from POST /orders body for server-side repricing.
 */
async function enrichOrderItemsForPricing(items) {
  const Service = require("../models/Service.js");
  const Product = require("../models/Product.js");
  const Tailor = require("../models/Tailor.js");
  const StyleAddon = require("../models/StyleAddon.js");

  const enriched = [];
  for (const item of items) {
    if (item.product) {
      enriched.push(item);
      continue;
    }
    const serviceId = item.service || item.serviceDetails?.id || item.serviceDetails?._id;
    if (!serviceId) continue;

    const svc = await Service.findById(serviceId).lean();
    // Service.tailor is a ref to the Tailor profile model _id (not User._id)
    const tailorProfileId = svc?.tailor || item.serviceDetails?.tailorId || item.serviceDetails?.tailor;
    let tailorProfile = null;
    if (tailorProfileId) {
      // First try as Tailor profile _id
      tailorProfile = await Tailor.findById(tailorProfileId).lean();
      // Fallback: maybe it's a User._id
      if (!tailorProfile) {
        tailorProfile = await Tailor.findOne({ user: tailorProfileId }).lean();
      }
    }

    const selectedFabric = item.selectedFabric || item.configuration?.selectedFabric;
    let fabricPrice = 0;
    if (selectedFabric) {
      const fabricId =
        typeof selectedFabric === "object"
          ? selectedFabric._id || selectedFabric.id
          : selectedFabric;
      if (fabricId) {
        const fabric = await Product.findById(fabricId).lean();
        fabricPrice = Number(fabric?.price) || Number(selectedFabric?.price) || 0;
      } else if (typeof selectedFabric === "object" && Number(selectedFabric.price) > 0) {
        fabricPrice = Number(selectedFabric.price);
      }
    }

    const addons = item.addons || item.configuration?.addons;
    let addonsTotal = 0;
    if (Array.isArray(addons) && addons.length > 0) {
      for (const a of addons) {
        const addonId = typeof a === "string" ? a : a?._id || a?.id || a?.addon;
        if (addonId && mongoose.Types.ObjectId.isValid(addonId)) {
          const addonDoc = await StyleAddon.findById(addonId).lean();
          if (addonDoc && Number(addonDoc.price) > 0) {
            addonsTotal += Number(addonDoc.price);
          }
        } else if (typeof a === "object" && a !== null && Number(a.price) > 0) {
          // Fallback only if it's a dynamic text-based addon without an ID
          addonsTotal += Number(a.price);
        }
      }
    } else if (Number(item.pricing?.addons) > 0) {
      addonsTotal = Number(item.pricing.addons);
    }

    // Include customization price additions
    const custs = item.customizations || item.configuration?.customizations;
    if (custs && typeof custs === 'object') {
      for (const c of Object.values(custs)) {
        if (c && c.enabled && Number(c.price) > 0) {
          addonsTotal += Number(c.price);
        }
      }
    } else if (Number(item.pricing?.customizations) > 0) {
      addonsTotal += Number(item.pricing.customizations);
    }

    const basePrice =
      Number(svc?.basePrice) ||
      Number(item.pricing?.base) ||
      Number(item.price) ||
      0;

    const isTailorAtHome =
      item.isTailorAtHome ||
      item.configuration?.isTailorAtHome ||
      item.measurements?.type === "home";

    const fabricSource =
      item.fabricSource || item.configuration?.fabricSource || "customer";

    const deliveryType =
      item.deliveryType || item.configuration?.deliveryType || "standard";

    const tailorCoordinates =
      tailorProfile?.location?.coordinates || item.serviceDetails?.tailorCoordinates;

    enriched.push({
      pricing: {
        base: basePrice,
        addons: addonsTotal,
        fabric: fabricPrice,
        tailorAtHome: Number(item.pricing?.tailorAtHome) || 0,
      },
      configuration: {
        isTailorAtHome,
        fabricSource,
        deliveryType,
      },
      serviceDetails: {
        tailorCoordinates,
      },
    });
  }
  return enriched;
}

function splitAdvanceRemaining(total, advancePercentage) {
  const pct = Math.min(100, Math.max(0, Number(advancePercentage) || 0));
  const totalInt = Math.round(Number(total) || 0);
  if (pct >= 100) {
    return { advanceAmount: totalInt, remainingAmount: 0 };
  }
  const advanceAmount = Math.round(totalInt * (pct / 100));
  return {
    advanceAmount,
    remainingAmount: totalInt - advanceAmount,
  };
}

module.exports = {
  computeCheckoutPricing,
  enrichOrderItemsForPricing,
  splitAdvanceRemaining,
  computeVisitFee,
};
