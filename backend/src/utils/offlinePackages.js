/**
 * Offline stitching packages — not the same as online Order.deliveryType.
 * TODO: Move to Settings.offlinePackages when admin-editable config UI is needed.
 */
const DEFAULT_OFFLINE_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    description: "Standard stitching with essential finishing",
    defaultPrice: 800,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Better finishing, reinforced seams, premium fit",
    defaultPrice: 1500,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Hand finishing, designer detailing, priority queue",
    defaultPrice: 2500,
  },
];

const DEFAULT_GARMENT_TYPES = [
  "Suit",
  "Pheran",
  "Blouse",
  "Kurti",
  "Lehenga",
  "Shirt",
  "Pant",
  "Kurta",
  "Sherwani",
  "Anarkali",
  "Jacket/Blazer",
  "Skirt",
  "Alteration",
  "Other",
];

module.exports = {
  DEFAULT_OFFLINE_PACKAGES,
  DEFAULT_GARMENT_TYPES,
};
