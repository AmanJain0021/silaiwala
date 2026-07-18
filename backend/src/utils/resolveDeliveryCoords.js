const { getDistanceFromLatLonInKm } = require("./haversine.js");

/** Rough India bounding box — rejects clearly bad / swapped coordinates */
function isValidIndiaCoords(lng, lat) {
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    !Number.isNaN(lng) &&
    !Number.isNaN(lat) &&
    lat >= 6 &&
    lat <= 37 &&
    lng >= 68 &&
    lng <= 98
  );
}

function coordsFromLocation(location) {
  if (!location?.coordinates || location.coordinates.length < 2) return null;
  const [lng, lat] = location.coordinates;
  if (!isValidIndiaCoords(lng, lat)) return null;
  return [lng, lat];
}

/** Known city centers used to detect stale/wrong geocodes on addresses */
const CITY_CENTERS = {
  indore: [75.8577, 22.7196],
  bhopal: [77.4126, 23.2599],
  ujjain: [75.7849, 23.1765],
  dewas: [76.0508, 22.9623],
  srinagar: [74.7973, 34.0837],
};

function normalizeCity(cityName) {
  if (!cityName) return null;
  const key = String(cityName).toLowerCase().trim();
  if (!key || key === "unknown" || key === "auto" || key === "n/a") return null;
  return key;
}

/** Infer city from free-text street when city field is Unknown/missing */
function inferCityFromText(...parts) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (!text) return null;
  for (const city of Object.keys(CITY_CENTERS)) {
    if (text.includes(city)) return city;
  }
  return null;
}

function coordsMatchCity(coords, cityName) {
  if (!coords) return false;
  const key = normalizeCity(cityName);
  if (!key) return true; // no city signal — don't reject yet
  const center = CITY_CENTERS[key];
  if (!center) return true;
  const km = getDistanceFromLatLonInKm(coords[1], coords[0], center[1], center[0]);
  return km <= 40;
}

function streetKey(street) {
  if (!street) return "";
  return String(street)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 48);
}

/**
 * Resolve the start point for a fabric pickup job.
 * Handles Unknown city + wrong default coords (e.g. Srinagar pin on an Indore street).
 * @returns {[lng, lat]|null}
 */
function resolvePickupStartCoords(order, customerDoc) {
  const orderStreet = order?.deliveryAddress?.street || "";
  const orderCity =
    normalizeCity(order?.deliveryAddress?.city) ||
    inferCityFromText(orderStreet, order?.deliveryAddress?.state);

  let fromOrder = coordsFromLocation(order?.deliveryAddress?.location);
  if (fromOrder && orderCity && !coordsMatchCity(fromOrder, orderCity)) {
    console.warn(
      `⚠️ [resolveDeliveryCoords] Order ${order?.orderId || order?._id} coords don't match city "${orderCity}". Ignoring order coords.`
    );
    fromOrder = null;
  }

  // Prefer a customer saved address that matches this order's street / city
  let fromCustomer = null;
  let fromMatchingStreet = null;

  if (customerDoc?.addresses?.length) {
    const orderKey = streetKey(orderStreet);

    for (const addr of customerDoc.addresses) {
      const c = coordsFromLocation(addr?.location);
      if (!c) continue;

      const addrCity =
        normalizeCity(addr.city) || inferCityFromText(addr.street, addr.state) || orderCity;

      if (orderKey && streetKey(addr.street) === orderKey && coordsMatchCity(c, addrCity || orderCity)) {
        fromMatchingStreet = c;
        break;
      }
    }

    // Same city, valid coords
    if (!fromMatchingStreet && orderCity) {
      for (const addr of customerDoc.addresses) {
        const c = coordsFromLocation(addr?.location);
        if (!c) continue;
        const addrCity =
          normalizeCity(addr.city) || inferCityFromText(addr.street, addr.state);
        if ((addrCity === orderCity || coordsMatchCity(c, orderCity)) && coordsMatchCity(c, orderCity)) {
          fromCustomer = c;
          break;
        }
      }
    }

    // Default / first only if it matches inferred city
    if (!fromMatchingStreet && !fromCustomer) {
      const preferred =
        customerDoc.addresses.find((a) => a.isDefault) || customerDoc.addresses[0];
      const c = coordsFromLocation(preferred?.location);
      const preferredCity =
        normalizeCity(preferred?.city) ||
        inferCityFromText(preferred?.street, preferred?.state) ||
        orderCity;
      if (c && (!orderCity || coordsMatchCity(c, orderCity) || coordsMatchCity(c, preferredCity))) {
        // Still reject if order clearly says Indore but default is Srinagar
        if (!orderCity || coordsMatchCity(c, orderCity)) {
          fromCustomer = c;
        }
      }
    }
  }

  if (fromMatchingStreet) return fromMatchingStreet;

  if (fromOrder && fromCustomer) {
    const mismatchKm = getDistanceFromLatLonInKm(
      fromOrder[1],
      fromOrder[0],
      fromCustomer[1],
      fromCustomer[0]
    );
    if (mismatchKm > 50) {
      console.warn(
        `⚠️ [resolveDeliveryCoords] Order ${order?.orderId || order?._id} coords mismatch (${mismatchKm}km). Using customer address.`
      );
      return fromCustomer;
    }
  }

  if (fromOrder) return fromOrder;
  if (fromCustomer) return fromCustomer;

  // Last resort: known city center from inferred city (keeps 15km search in the right metro)
  if (orderCity && CITY_CENTERS[orderCity]) {
    console.warn(
      `⚠️ [resolveDeliveryCoords] Falling back to ${orderCity} city center for order ${order?.orderId || order?._id}`
    );
    return CITY_CENTERS[orderCity];
  }

  return null;
}

module.exports = {
  isValidIndiaCoords,
  coordsFromLocation,
  resolvePickupStartCoords,
  inferCityFromText,
  normalizeCity,
};
