/**
 * Service to validate Order and Tailor profiles before sending them to Shiprocket.
 * Prevents API failures and hardcoded fallbacks by ensuring data completeness.
 */
class ShiprocketValidationService {
    /**
     * Validates an order for Shiprocket integration.
     * @param {Object} order - Populated Mongoose Order object
     * @param {Object} tailorProfile - Populated Tailor profile
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    static validateOrderForShipment(order, tailorProfile) {
        const errors = [];

        // 1. Order Existence & Type Validations
        if (!order) {
            errors.push("Order not found.");
            return { isValid: false, errors };
        }

        const isReadyMadeProductOrder = order.items.some(
            (item) => item.product
        );
        if (!isReadyMadeProductOrder) {
            errors.push("Shiprocket is only available for Ready-Made Product orders.");
        }

        if (order.shiprocketDetails?.shipmentId) {
            errors.push("Shipment has already been created.");
        }

        // 2. Tailor / Pickup Location Validation
        if (!tailorProfile) {
            errors.push("Tailor profile is missing.");
        } else if (!tailorProfile.shiprocketPickupLocation || tailorProfile.shiprocketPickupLocation.trim() === "Primary" && !tailorProfile.isShiprocketConfigured) {
            // Note: If they use "Primary", ideally we ensure it's intentional. But for now, we just ensure it exists.
            if (!tailorProfile.shiprocketPickupLocation) {
                errors.push("Pickup location has not been configured for this tailor.");
            }
        }

        // 3. Customer Info Validation
        if (!order.customer) {
            errors.push("Customer information is missing.");
        } else {
            if (!order.customer.name || order.customer.name.trim() === "") {
                errors.push("Customer name is required.");
            }
            if (!order.customer.phoneNumber || order.customer.phoneNumber.trim() === "") {
                errors.push("Customer phone number is required.");
            }
            if (!order.customer.email || order.customer.email.trim() === "") {
                errors.push("Customer email is required.");
            }
        }

        // 4. Delivery Address Validation
        if (!order.deliveryAddress) {
            errors.push("Shipment cannot be created because the customer's delivery address is missing.");
        } else {
            if (!order.deliveryAddress.street || order.deliveryAddress.street.trim() === "") {
                errors.push("Customer's delivery street address is missing.");
            }
            if (!order.deliveryAddress.city || order.deliveryAddress.city.trim() === "") {
                errors.push("Customer's delivery city is missing.");
            }
            if (!order.deliveryAddress.state || order.deliveryAddress.state.trim() === "") {
                errors.push("Customer's delivery state is missing.");
            }
            if (!order.deliveryAddress.zipCode || order.deliveryAddress.zipCode.trim() === "") {
                errors.push("Customer's delivery pincode is missing.");
            }
        }

        // 5. Product Dimensions Validation
        if (order.items && order.items.length > 0) {
            order.items.forEach((item, index) => {
                if (item.product) {
                    const product = item.product;
                    if (!product) {
                        errors.push(`Product data is missing for item #${index + 1}.`);
                        return;
                    }
                    
                    if (!product.weight || product.weight <= 0) {
                        errors.push(`Product shipping dimensions are incomplete: Weight is missing for '${product.name || "Product"}'. Please update the product before generating a shipment.`);
                    }
                    if (!product.length || product.length <= 0) {
                        errors.push(`Product shipping dimensions are incomplete: Length is missing for '${product.name || "Product"}'. Please update the product before generating a shipment.`);
                    }
                    if (!product.width || product.width <= 0) {
                        errors.push(`Product shipping dimensions are incomplete: Width is missing for '${product.name || "Product"}'. Please update the product before generating a shipment.`);
                    }
                    if (!product.height || product.height <= 0) {
                        errors.push(`Product shipping dimensions are incomplete: Height is missing for '${product.name || "Product"}'. Please update the product before generating a shipment.`);
                    }
                }
            });
        } else {
            errors.push("Order has no items.");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ShiprocketValidationService;
