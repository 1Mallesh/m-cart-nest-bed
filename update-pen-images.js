const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/M-Cart');
  const r = await mongoose.connection.db.collection('products').updateOne(
    { slug: 'smooth-gel-pen-blue' },
    { $set: { images: ['/demo/pen.svg','/demo/pen-2.svg','/demo/pen-3.svg','/demo/pen-4.svg'] } },
  );
  console.log('matched', r.matchedCount, 'modified', r.modifiedCount);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
