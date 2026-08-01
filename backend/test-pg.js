const { Pool } = require('pg');
const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function test() {
  try {
    const url = 'postgresql://postgres:MedsynexaPostgres2026!@db.aegepatgascjcciwltgd.supabase.co:5432/postgres';
    const parsed = new URL(url);
    const host = parsed.hostname;
    
    console.log(`Resolving ${host}...`);
    const addresses = await dns.resolve6(host);
    console.log('Resolved to:', addresses[0]);
    
    parsed.hostname = `[${addresses[0]}]`;
    const newUrl = parsed.toString();
    console.log('Connecting to:', newUrl);
    
    const pool = new Pool({ connectionString: newUrl });
    await pool.connect();
    console.log('✅ Connected successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
}
test();
