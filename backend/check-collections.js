/**
 * MongoDB Collection Checker
 * Verifies all collections exist and shows their structure
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/urlshortener?authSource=admin';

async function checkCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📊 Found Collections:');
    console.log('='.repeat(60));

    if (collections.length === 0) {
      console.log('⚠️  No collections found. Collections will be created when data is inserted.');
    } else {
      for (const collection of collections) {
        console.log(`\n📁 ${collection.name}`);
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   Documents: ${count}`);

        // Get sample document structure
        const sample = await db.collection(collection.name).findOne();
        if (sample) {
          console.log(`   Sample Fields: ${Object.keys(sample).join(', ')}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Collection check complete!');

    // Expected collections
    const expectedCollections = [
      'shorturls',
      'clicks',
      'users',
      'apikeys',
      'sessions',
      'refreshtokens',
      'auditlogs',
      'qrcodes',
      'ratelimits',
      'analyticsdailies',
      'analyticshourlies',
    ];

    console.log('\n📋 Expected Collections:');
    expectedCollections.forEach((name) => {
      const exists = collections.some((c) => c.name === name);
      const icon = exists ? '✅' : '⏳';
      console.log(`   ${icon} ${name}`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCollections();



