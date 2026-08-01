const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS to use Google's Public DNS (bypassing ISP blocks on SRV)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://vivekshenoy6763_db_user:codekudla2026@cluster0.hiei8tt.mongodb.net/medsynexa_db?appName=Cluster0';

mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ Connected successfully to Atlas using SRV with Google DNS!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
