const { getDistanceFromLatLonInKm } = require("./haversine.js");

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

    if (freeDeliveryMinOrder > 0 && totalBase > freeDeliveryMinOrder) {
      orderDeliveryFee = 0;
      freeDeliveryApplied = true;
    }
  } else {
    let deliveryDistanceKm = 0;
    let deliveryApplied = false;

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
        if (item.configuration?.isTailorAtHome) {
          if (distanceKm <= visitSettings.freeKm) {
            dynamicTailorAtHome = Number(visitSettings.baseFee) || 0;
          } else {
            dynamicTailorAtHome = Math.round(
              Number(visitSettings.baseFee) +
                (distanceKm - visitSettings.freeKm) * Number(visitSettings.perKmFee)
            );
          }
        }
      }

      totalBase += itemBase;
      totalAddons += itemAddons;
      totalFabric += itemFabric;
      totalTailorAtHome += dynamicTailorAtHome;

      const needsLegDelivery =
        item.configuration?.fabricSource === "customer" ||
        (item.configuration?.deliveryType && item.configuration.deliveryType !== "self");

      if (!deliveryApplied && needsLegDelivery) {
        deliveryDistanceKm = distanceKm;
        deliveryApplied = true;
      }
    }

    if (deliveryApplied) {
      if (deliveryDistanceKm > 0) {
        orderDeliveryFee = Math.round(
          Number(deliveryRates.baseFee) + deliveryDistanceKm * Number(deliveryRates.perKmRate)
        );
      } else {
        orderDeliveryFee = Math.round(Number(deliveryRates.baseFee) || 0);
      }
    }

    const merchandiseSubtotal = totalBase + totalAddons + totalFabric + totalTailorAtHome;
    if (freeDeliveryMinOrder > 0 && merchandiseSubtotal > freeDeliveryMinOrder) {
      orderDeliveryFee = 0;
      freeDeliveryApplied = true;
    }
  }

  const platformFeeAmount = Math.round(
    (totalBase + totalAddons) * (platformFeePercentage / 100)
  );
  const taxableAmount =
    totalBase + totalAddons + totalFabric + totalTailorAtHome + platformFeeAmount;
  const totalTaxes = Math.round(taxableAmount * (gstPercentage / 100));

  const finalTotal =
    totalBase +
    totalAddons +
    totalFabric +
    totalTailorAtHome +
    platformFeeAmount +
    totalTaxes +
    orderDeliveryFee;

  return {
    total: finalTotal,
    base: totalBase,
    taxes: totalTaxes,
    delivery: orderDeliveryFee,
    addons: totalAddons,
    fabric: totalFabric,
    tailorAtHome: totalTailorAtHome,
    platformFee: platformFeeAmount,
    platformFeePercentage,
    gstPercentage,
    subtotalBeforeTax:
      totalBase + totalAddons + totalFabric + totalTailorAtHome + platformFeeAmount,
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
    const tailorUserId = svc?.tailor || item.serviceDetails?.tailorId || item.serviceDetails?.tailor;
    const tailorProfile = tailorUserId
      ? await Tailor.findOne({ user: tailorUserId }).lean()
      : null;

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
        if (typeof a === "object" && a !== null && Number(a.price) > 0) {
          addonsTotal += Number(a.price);
        } else {
          const addonId = typeof a === "string" ? a : a?._id || a?.id || a?.addon;
          if (addonId) {
            const addonDoc = await StyleAddon.findById(addonId).lean();
            if (addonDoc && Number(addonDoc.price) > 0) {
              addonsTotal += Number(addonDoc.price);
            }
          }
        }
      }
    } else if (Number(item.pricing?.addons) > 0) {
      addonsTotal = Number(item.pricing.addons);
    }

    const basePrice =
      Number(item.price) ||
      Number(item.pricing?.base) ||
      Number(svc?.basePrice) ||
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
};
