const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
require('dotenv').config({ path: './.env' });

async function testPull() {
  await mongoose.connect(process.env.MONGO_URI);
  const carts = await Cart.find({}); const cart = carts.find(c => c.items.length > 0);
  if (cart && cart.items.length > 0) {
    console.log("Before:", cart.items.length);
    const itemId = cart.items[0]._id.toString();
    console.log("Removing", itemId);
    
    // Method 1: pull
    // cart.items.pull({ _id: itemId }); 
    // Let's try what we currently have in code:
    cart.items.pull({ _id: itemId });
    
    console.log("After pull():", cart.items.length);
    
    // Method 2: filter + markModified
    // cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    // cart.markModified('items');
    
    // Method 3: item.deleteOne()
    const item = cart.items.id(itemId);
    if (item) {
      item.deleteOne();
      console.log("After item.deleteOne():", cart.items.length);
    } else {
      console.log("item.id() returned null");
    }
  } else {
    console.log("No cart or empty items array");
  }
  mongoose.disconnect();
}
testPull();
