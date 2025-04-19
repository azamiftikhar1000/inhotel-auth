// Test script to verify MongoDB connection
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    // Connection URI
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    
    // Create a MongoDB client
    const client = new MongoClient(uri, {
      auth: {
        username: process.env.MONGO_USER || 'pica',
        password: process.env.MONGO_PASSWORD || 'picapassword'
      }
    });
    
    // Connect to the MongoDB server
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // List all databases
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Check for the specific database
    const dbName = process.env.MONGO_DATABASE || 'pica';
    console.log(`\nChecking for database: ${dbName}`);
    
    // Check if the database exists
    const dbExists = dbs.databases.some(db => db.name === dbName);
    if (dbExists) {
      console.log(`✅ Database "${dbName}" found`);
      
      // Get database reference
      const database = client.db(dbName);
      
      // List collections in the database
      const collections = await database.listCollections().toArray();
      console.log(`\nCollections in "${dbName}" database:`);
      collections.forEach(coll => {
        console.log(`- ${coll.name}`);
      });
      
      // Check for sessions collection
      const sessionsExists = collections.some(coll => coll.name === 'sessions');
      if (sessionsExists) {
        console.log(`\n✅ Collection "sessions" found`);
        
        // Count documents in sessions collection
        const count = await database.collection('sessions').countDocuments();
        console.log(`Number of documents in "sessions" collection: ${count}`);
        
        // Show a sample document
        if (count > 0) {
          const sample = await database.collection('sessions').findOne({});
          console.log('\nSample document structure:');
          console.log(JSON.stringify(sample, null, 2));
        }
      } else {
        console.log('\n❌ Collection "sessions" not found');
      }
    } else {
      console.log(`❌ Database "${dbName}" not found`);
    }
    
    await client.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  }
}

main(); 