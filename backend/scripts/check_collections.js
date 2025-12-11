const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linkify';

async function main(){
  try{
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo:', MONGO);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c=>c.name);
    console.log('Collections in DB:', names);

    async function countIfExists(name){
      if(names.includes(name)){
        const count = await db.collection(name).countDocuments();
        console.log(`Collection '${name}' exists. Documents: ${count}`);
      } else {
        console.log(`Collection '${name}' does not exist.`);
      }
    }

    await countIfExists('shorturls');
    await countIfExists('clicks');

    await mongoose.disconnect();
    process.exit(0);
  }catch(err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
