const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/v1/deliveries/orders/ORD-39AD63E6');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log(e.response?.data || e.message);
    }
}
test();
