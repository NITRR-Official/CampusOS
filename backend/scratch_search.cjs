const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campusos').then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.collections();
  for (let collection of collections) {
    const docs = await collection.find({ $or: [ { name: /phase/i }, { description: /phase/i } ] }).toArray();
    if (docs.length > 0) console.log(collection.collectionName, docs);
  }
  process.exit(0);
}).catch(console.error);
