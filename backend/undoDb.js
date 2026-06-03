const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor')
  .then(async () => {
    const Tailor = require('./src/models/Tailor');
    await Tailor.updateMany(
      { 'location.address': 'Linking Road, Bandra West, Mumbai, 400050' },
      { $unset: { 'location.address': "" } }
    );
    console.log('Reverted tailors successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
