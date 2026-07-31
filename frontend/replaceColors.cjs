const fs = require('fs');
let c = fs.readFileSync('src/modules/customer/pages/CheckoutSummary.jsx', 'utf8');

c = c.replace(/bg-\[#6D28D9\]/g, 'bg-primary');
c = c.replace(/text-\[#7C3AED\]/g, 'text-primary');
c = c.replace(/bg-\[#FAF5FF\]/g, 'bg-primary/5');
c = c.replace(/border-\[#F3E8FF\]/g, 'border-primary/10');
c = c.replace(/text-\[#6D28D9\]/g, 'text-primary');
c = c.replace(/hover:bg-\[#5B21B6\]/g, 'hover:bg-primary/90');
c = c.replace(/active:bg-\[#4C1D95\]/g, 'active:bg-primary/80');
c = c.replace(/text-\[#7C3AED\]/g, 'text-primary');

fs.writeFileSync('src/modules/customer/pages/CheckoutSummary.jsx', c);
