require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');
const User = require('./src/models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orderId = '6a4234ca32952a710febe9f3';
        const order = await Order.findById(orderId).populate('customer').populate('items.product');
        if (!order) {
            console.log("Order not found");
            process.exit(1);
        }
        console.log("Order found:");
        console.log("Customer:", order.customer?.name);
        console.log("Tailor ID:", order.tailor);
        console.log("Delivery Address:", order.deliveryAddress);
        console.log("Payment Status:", order.paymentStatus);
        console.log("Total Amount:", order.totalAmount);
        console.log("Order Items:");
        order.items.forEach(item => {
            console.log("-", item.product?.name, item.quantity);
        });

        // Test shiprocket util
        const { createOrder } = require('./src/utils/shiprocket');
        const shiprocketOrderData = {
            order_id: order.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            channel_id: "",
            comment: "SilaiWala Ready-Made Product",
            billing_customer_name: order.customer?.name || "Customer",
            billing_last_name: "",
            billing_address: order.deliveryAddress?.street || "Address",
            billing_city: order.deliveryAddress?.city || "City",
            billing_pincode: order.deliveryAddress?.zipCode || "110001",
            billing_state: order.deliveryAddress?.state || "State",
            billing_country: "India",
            billing_email: order.customer?.email || "customer@example.com",
            billing_phone: order.customer?.phoneNumber || "9999999999",
            shipping_is_billing: true,
            order_items: order.items.map(item => ({
                name: item.product?.name || "Product",
                sku: item.product?._id.toString() || "1",
                units: item.quantity || 1,
                selling_price: item.price || 100,
                discount: 0,
                tax: 0,
                hsn: ""
            })),
            payment_method: order.paymentStatus === 'paid' ? 'Prepaid' : 'COD',
            sub_total: order.totalAmount,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        console.log("Calling Shiprocket...");
        const res = await createOrder(shiprocketOrderData);
        console.log("Shiprocket Success:", res);

    } catch (e) {
        console.error("Error Details:", e.response?.data || e.message);
    }
    process.exit(0);
};

run();
