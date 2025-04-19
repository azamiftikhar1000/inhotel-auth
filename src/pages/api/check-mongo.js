// API endpoint to check MongoDB connectivity
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    // Log the environment variables (values will be masked for security)
    console.log("Environment variables:");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not set");
    console.log("MONGO_USER:", process.env.MONGO_USER ? "Set" : "Not set");
    console.log("MONGO_PASSWORD:", process.env.MONGO_PASSWORD ? "Set (length: " + (process.env.MONGO_PASSWORD?.length || 0) + ")" : "Not set");
    console.log("MONGO_DATABASE:", process.env.MONGO_DATABASE ? "Set" : "Not set");
    
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const mongoConfig = {};
    
    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
      mongoConfig.auth = {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD
      };
    }
    
    console.log("Connecting to MongoDB:", uri);
    const client = new MongoClient(uri, mongoConfig);
    
    await client.connect();
    console.log("Connected successfully to MongoDB server");

    // Get database info
    const dbName = process.env.MONGO_DATABASE || 'events-service';
    console.log("Using database:", dbName);
    const database = client.db(dbName);
    
    // List collections to verify access
    const collections = await database.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log("Available collections:", collectionNames);
    
    // Check for specific collections
    const sessionsExists = collectionNames.includes('sessions');
    const connectionDefsExists = collectionNames.includes('connection-definitions');
    const embedTokensExists = collectionNames.includes('embed-tokens');
    
    // Get sample data counts
    let embedTokensCount = 0;
    let sampleEmbedToken = null;
    
    if (embedTokensExists) {
      embedTokensCount = await database.collection('embed-tokens').countDocuments();
      console.log(`Found ${embedTokensCount} documents in embed-tokens collection`);
      
      if (embedTokensCount > 0) {
        sampleEmbedToken = await database.collection('embed-tokens').findOne(
          {}, 
          { projection: { 
              _id: 1, 
              sessionId: 1, 
              'linkSettings.eventIncToken': 1,
              createdAt: 1
            } 
          }
        );
        console.log("Sample embed token found:", JSON.stringify(sampleEmbedToken, null, 2));
      }
    }
    
    let connectionDefsCount = 0;
    let sampleConnectionDef = null;
    
    if (connectionDefsExists) {
      connectionDefsCount = await database.collection('connection-definitions').countDocuments();
      console.log(`Found ${connectionDefsCount} documents in connection-definitions collection`);
      
      if (connectionDefsCount > 0) {
        // Look specifically for apaleo platform
        sampleConnectionDef = await database.collection('connection-definitions').findOne(
          { platform: 'apaleo' }
        );
        
        if (sampleConnectionDef) {
          console.log("Found apaleo connection definition:", JSON.stringify(sampleConnectionDef, null, 2));
        } else {
          console.log("No apaleo connection definition found, getting a sample instead");
          sampleConnectionDef = await database.collection('connection-definitions').findOne({});
          if (sampleConnectionDef) {
            console.log("Sample connection definition:", JSON.stringify(sampleConnectionDef, null, 2));
          }
        }
      }
    }
    
    // Close the connection
    await client.close();
    
    // Return success response with diagnostic info
    return res.status(200).json({
      success: true,
      mongoConnected: true,
      database: dbName,
      collections: collectionNames,
      diagnostics: {
        sessionsCollectionExists: sessionsExists,
        connectionDefsCollectionExists: connectionDefsExists,
        connectionDefsCount: connectionDefsCount,
        embedTokensCollectionExists: embedTokensExists,
        embedTokensCount: embedTokensCount,
        sampleEmbedToken: sampleEmbedToken,
        sampleConnectionDef: sampleConnectionDef
      }
    });
    
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    
    return res.status(500).json({
      success: false,
      error: String(error),
      message: "Failed to connect to MongoDB",
      mongoConnected: false
    });
  }
} 