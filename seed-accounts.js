/* Seed real login accounts (vendor + admin) with bcrypt passwords so you can
   log into the M-Cart panels. Run: node seed-accounts.js  */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/M-Cart';

const ACCOUNTS = [
  { name: 'Vendor Admin', email: 'vendor@mcart.local', password: 'Vendor@123', roles: ['vendor'] },
  { name: 'Platform Admin', email: 'admin@mcart.local', password: 'Admin@123', roles: ['admin', 'super_admin'] },
];

async function main() {
  await mongoose.connect(URI);
  const users = mongoose.connection.db.collection('users');
  const now = new Date();

  for (const a of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    await users.updateOne(
      { email: a.email },
      {
        $set: {
          name: a.name,
          email: a.email,
          passwordHash,
          roles: a.roles,
          isActive: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    const u = await users.findOne({ email: a.email });
    console.log(`✅ ${a.roles.join('+').padEnd(20)} ${a.email} / ${a.password}   id=${u._id}`);

    // Point the seeded Pen product at the vendor account so it shows in their panel
    if (a.roles.includes('vendor')) {
      const r = await mongoose.connection.db
        .collection('products')
        .updateOne({ slug: 'smooth-gel-pen-blue' }, { $set: { vendor: u._id } });
      console.log(`   linked Pen product to vendor (matched ${r.matchedCount})`);
    }
  }

  console.log('\nLogin at /login with the credentials above.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('SEED ERROR:', e.message);
  process.exit(1);
});
