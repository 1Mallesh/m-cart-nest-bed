/* Seed ONE real, approved product (₹5 Pen) + its category + a vendor user,
   so the M-Cart storefront has a live product to test end-to-end:
   browse → cart → order → payment → DB. Run: node seed-pen.js  */
const mongoose = require('mongoose');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/M-Cart';

async function main() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const now = new Date();

  // 1) Vendor user (so the product has a real vendor ref)
  const users = db.collection('users');
  let vendor = await users.findOne({ email: 'pen.vendor@mcart.local' });
  if (!vendor) {
    const r = await users.insertOne({
      name: 'Pen Vendor',
      email: 'pen.vendor@mcart.local',
      roles: ['vendor'],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    vendor = { _id: r.insertedId };
    console.log('created vendor', vendor._id.toString());
  } else {
    console.log('vendor exists', vendor._id.toString());
  }

  // 2) Category: Stationery
  const cats = db.collection('categories');
  let cat = await cats.findOne({ slug: 'stationery' });
  if (!cat) {
    const r = await cats.insertOne({
      name: 'Stationery',
      slug: 'stationery',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    cat = { _id: r.insertedId };
    console.log('created category', cat._id.toString());
  } else {
    console.log('category exists', cat._id.toString());
  }

  // 3) Product: Smooth Gel Pen — APPROVED so it shows on the storefront
  const products = db.collection('products');
  const existing = await products.findOne({ slug: 'smooth-gel-pen-blue' });
  const doc = {
    vendor: vendor._id,
    title: 'Smooth Gel Pen — Blue Ink',
    slug: 'smooth-gel-pen-blue',
    description:
      'Premium 0.7mm gel pen with smudge-free quick-dry ink. Real product for live end-to-end testing.',
    price: 5,
    mrp: 10,
    currency: 'INR',
    category: cat._id,
    images: ['/demo/pen.svg'],
    attributes: {},
    status: 'approved',
    rating: 4.6,
    ratingCount: 12,
    isActive: true,
    updatedAt: now,
  };
  if (existing) {
    await products.updateOne({ _id: existing._id }, { $set: doc });
    console.log('UPDATED product', existing._id.toString());
  } else {
    const r = await products.insertOne({ ...doc, createdAt: now });
    console.log('CREATED product', r.insertedId.toString());
  }

  // 4) Inventory (stock) for the product
  const prod = await products.findOne({ slug: 'smooth-gel-pen-blue' });
  const inv = db.collection('inventories');
  await inv.updateOne(
    { product: prod._id },
    { $set: { product: prod._id, quantity: 1000, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );

  console.log('\n✅ Seed done.');
  console.log('   productId :', prod._id.toString());
  console.log('   vendorId  :', vendor._id.toString());
  console.log('   categoryId:', cat._id.toString());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('SEED ERROR:', e.message);
  process.exit(1);
});
