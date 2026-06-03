const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor')
  .then(async () => {
    const Tailor = require('./src/models/Tailor');
    await Tailor.updateMany(
      { 'location.address': { $exists: false } },
      { $set: { 'location.address': 'Linking Road, Bandra West, Mumbai, 400050' } }
    );
    console.log('Updated tailors successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
