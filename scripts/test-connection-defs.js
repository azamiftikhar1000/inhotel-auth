// Test script to verify connection-definitions collection in MongoDB
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
    
    // Get database reference
    const dbName = process.env.MONGO_DATABASE || 'pica';
    const database = client.db(dbName);
    
    // Check for connection-definitions collection
    const collections = await database.listCollections().toArray();
    const connectionDefsExists = collections.some(coll => coll.name === 'connection-definitions');
    
    if (!connectionDefsExists) {
      console.log('\n❌ Collection "connection-definitions" not found');
      
      // Create the collection
      console.log('Creating connection-definitions collection...');
      await database.createCollection('connection-definitions');
      
      // Insert sample data
      console.log('Inserting sample data for apaleo platform...');
      await database.collection('connection-definitions').insertOne({
        _id: "conn_def::apaleo::sample",
        platform: "apaleo",
        description: "Apaleo Connection Definition",
        created: new Date()
      });
      
      console.log('✅ Sample data inserted');
    } else {
      console.log('\n✅ Collection "connection-definitions" found');
      
      // Check for apaleo platform
      const apaleoConnection = await database.collection('connection-definitions').findOne({ platform: 'apaleo' });
      
      if (!apaleoConnection) {
        console.log('No connection definition found for apaleo platform');
        
        // Insert sample data
        console.log('Inserting sample data for apaleo platform...');
        await database.collection('connection-definitions').insertOne({
          _id: "conn_def::apaleo::sample",
          platform: "apaleo",
          description: "Apaleo Connection Definition",
          created: new Date()
        });
        
        console.log('✅ Sample data inserted');
      } else {
        console.log('Connection definition found for apaleo platform:');
        console.log(JSON.stringify(apaleoConnection, null, 2));
      }
    }
    
    await client.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main(); 