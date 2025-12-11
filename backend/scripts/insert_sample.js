const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linkify';

async function main(){
  const client = new MongoClient(MONGO, { useUnifiedTopology: true });
  try{
    await client.connect();
    console.log('Connected to Mongo:', MONGO);
    const db = client.db();

    // Insert sample ShortUrl
    const shorturls = db.collection('shorturls');
    const clicks = db.collection('clicks');

    const sample = {
      originalUrl: 'https://example.com',
      shortCode: 'test123',
      clicksCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Avoid duplicate shortCode
    const existing = await shorturls.findOne({ shortCode: sample.shortCode });
    let shortId;
    if (existing) {
      console.log('Sample short already exists with _id=', existing._id.toString());
      shortId = existing._id;
    } else {
      const r = await shorturls.insertOne(sample);
      shortId = r.insertedId;
      console.log('Inserted sample short with _id=', shortId.toString());
    }

    // Insert a click
    const click = {
      shortUrlId: shortId,
      shortCode: sample.shortCode,
      ip: '127.0.0.1',
      userAgent: 'Script/1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await clicks.insertOne(click);
    console.log('Inserted click for shortCode=', sample.shortCode);

    // Increment clicksCount
    const upd = await shorturls.updateOne({ _id: shortId }, { $inc: { clicksCount: 1 }, $set: { updatedAt: new Date() } });
    console.log('Updated short clicksCount, matched=', upd.matchedCount, 'modified=', upd.modifiedCount);

    // Report counts
    const suCount = await shorturls.countDocuments();
    const cCount = await clicks.countDocuments();
    console.log('shorturls count=', suCount, 'clicks count=', cCount);

    await client.close();
    process.exit(0);
  }catch(err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
