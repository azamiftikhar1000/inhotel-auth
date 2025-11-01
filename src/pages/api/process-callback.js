// Simple API endpoint for processing OAuth callback
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId, code, type, secret } = req.body;

    console.log('Received API request with data:', {
      sessionId, 
      codeLength: code ? code.length : 0,
      type
    });

    if (!sessionId || !code) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Debug session ID format
    console.log('Session ID format check:', {
      sessionId,
      length: sessionId ? sessionId.length : 0,
      format: sessionId ? (sessionId.startsWith('session_id::') ? 'valid' : 'invalid') : 'missing'
    });

    // Connect to MongoDB
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const mongoConfig = {};
    
    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
      mongoConfig.auth = {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD
      };
    }
    
    console.log('Connecting to MongoDB:', uri);
    console.log('Using database:', process.env.MONGO_DATABASE || 'events-service');
    const client = new MongoClient(uri, mongoConfig);
    
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      
      // Query the embed-tokens collection
      const database = client.db(process.env.MONGO_DATABASE || 'events-service');
      const embedTokensCollection = database.collection('embed-tokens');
      const connectionOauthDefinitionsCollection = database.collection('connection-oauth-definitions');
      
      // Find the embed token with matching sessionId
      console.log('Looking for embed token with sessionId:', sessionId);
      const embedToken = await embedTokensCollection.findOne({ sessionId: sessionId });
      
      // Log the full embedToken object
      console.log('Query result:', embedToken ? 'Document found' : 'No document found');
      
      if (!embedToken) {
        console.log('Embed token not found for sessionId:', sessionId);
        
        // Log a count of available tokens for debugging
        const tokenCount = await embedTokensCollection.countDocuments();
        console.log(`Total embed tokens in collection: ${tokenCount}`);
        
        // Try to find a sample token
        const sampleToken = await embedTokensCollection.findOne({});
        if (sampleToken) {
          console.log('Sample token structure:');
          console.log('Sample token _id:', sampleToken._id);
          console.log('Sample token sessionId:', sampleToken.sessionId);
          console.log('Sample token keys:', Object.keys(sampleToken));
        }
        
        return res.status(404).json({ message: 'Embed token not found' });
      }
      
      // Log the complete embed token (for debugging)
      console.log('Found embed token:');
      console.log(JSON.stringify(embedToken, null, 2));
      
      // Extract eventIncToken from linkSettings
      if (!embedToken.linkSettings || !embedToken.linkSettings.eventIncToken) {
        console.log('Embed token structure:', JSON.stringify(embedToken, null, 2));
        console.log('No eventIncToken found in the embed token document');
        return res.status(404).json({ message: 'eventIncToken not found in the embed token' });
      }
      
      const linkToken = embedToken.linkSettings.eventIncToken;
      const formData = embedToken.formData;
      console.log('Link Token found (eventIncToken):', linkToken);
      console.log('Form Data found:', formData);

      const connectionOauthDefinition = await connectionOauthDefinitionsCollection.findOne({ connectionPlatform: type });
      if (!connectionOauthDefinition) {
        console.log('Connection OAuth Definition not found for platform:', type);
        return res.status(404).json({ message: 'Connection OAuth Definition not found for platform' });
      }
      console.log('Connection OAuth Definition found:', connectionOauthDefinition);
      const registeredRedirect =
				process.env.OAUTH_REDIRECT_URI ||
				connectionOauthDefinition.platformRedirectUri ||
				(connectionOauthDefinition.frontend && connectionOauthDefinition.frontend.iosRedirectUri) ||
				'https://auth.inhotel.io/callback';

			const redirectUri = registeredRedirect;
      
      // // Get connectionDefinitionId from connection-definitions collection
      // const connectionDefsCollection = database.collection('connection-definitions');
      // const connectionDef = await connectionDefsCollection.findOne({ platform: type });
      
      // if (!connectionDef) {
      //   console.log('Connection definition not found for apaleo');
        
      //   // Log all available connection definitions
      //   const connectionDefs = await connectionDefsCollection.find({}).toArray();
      //   console.log(`Found ${connectionDefs.length} connection definitions:`);
      //   connectionDefs.forEach(def => {
      //     console.log(`- ${def._id}, platform: ${def.platform}`);
      //   });
        
      //   return res.status(404).json({ message: 'Connection definition not found for apaleo' });
      // }
      
      // console.log('Found connection definition:', JSON.stringify(connectionDef, null, 2));
      
      // const connectionDefinitionId = connectionDef._id;
      // console.log('Connection Definition ID:', connectionDefinitionId);
      
      let connectionDefinitionId = '';
      let clientId = '';
      
      // Try to extract clientId from embed token's connectedPlatforms if available
      if (embedToken.linkSettings && 
          embedToken.linkSettings.connectedPlatforms && 
          Array.isArray(embedToken.linkSettings.connectedPlatforms)) {
        
        console.log('Found connectedPlatforms in embed token, looking for matching platform type:', type);
        
        // Find the platform with matching type
        const matchingPlatform = embedToken.linkSettings.connectedPlatforms.find(
          platform => platform.type === type
        );
        
        if (!matchingPlatform) {
          console.log('No matching platform found for platform:', type);
          console.log('Available platforms:', JSON.stringify(embedToken.linkSettings.connectedPlatforms.map(p => ({ 
            connectionDefinitionId: p.connectionDefinitionId,
            type: p.type
          })), null, 2));
        } else {
          console.log('Found matching platform:', JSON.stringify(matchingPlatform, null, 2));
          connectionDefinitionId = matchingPlatform.connectionDefinitionId;
          
          if (matchingPlatform.secret && matchingPlatform.secret.clientId) {
            // If we have a clientId in the token, prefer it over the provided one
            clientId = matchingPlatform.secret.clientId;
            console.log(`Using clientId from embed token's connected platform: ${clientId}`);
          } else {
            console.log(`TODO: Get clientId from secretsServiceId (instead of token's clientId)`);
          }
        }
      } else {
        console.log('No connectedPlatforms found in embed token, using provided clientId');
      }
      
      // Set a default clientId if none was found
      if (!clientId) {
        console.error('Error: No clientId available');
        return res.status(400).json({ message: 'No clientId available' });
      }

			// Guardrails for redirectUri exact match
			if (!/^https:\/\/auth\.inhotel\.io\/callback$/.test(redirectUri)) {
				console.warn('Redirect URI mismatch:', redirectUri);
				return res.status(400).json({
					message: 'redirect_uri must be exactly https://auth.inhotel.io/callback'
				});
			}

			// Sanity log for token exchange parameters
			console.log('Token exchange params sanity:', {
				clientId,
				redirectUri,
				codeLength: code ? code.length : 0,
				platformType: type
			});
      
      // Make POST request to create OAuth embed connection
      const apiEndpoint = process.env.API_ENDPOINT || 'https://platform-backend.inhotel.io/public/v1/event-links/create-oauth-embed-connection';
      console.log('Making request to:', apiEndpoint);
      console.log('Using redirectUri:', redirectUri);
      
      // Create a properly structured request body
      const requestBody = {
        linkToken: linkToken,
        formData: formData,
        connectionDefinitionId: connectionDefinitionId,
        type: type,
        code: code,
        redirectUri: redirectUri,
        clientId: clientId
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pica-Secret': secret || process.env.X_PICA_SECRET || ''
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API Response status:', response.status);
      const result = await response.json();
      
      if (!response.ok) {
        console.log('API Error:', response.status, JSON.stringify(result, null, 2));
        
        // Enhanced error messages based on common failure patterns
        let errorMessage = 'API Error';
        let errorDetails = result;
        
        // Check for specific error patterns in the response
        if (result && result.name === 'MoleculerError' && result.message) {
          if (typeof result.message === 'object' && result.message.message) {
            if (result.message.message === 'Invalid connection credentials') {
              // This is likely a redirect_uri or client_id mismatch
              errorMessage = 'OAuth credentials error: The redirect URI or client ID might not match what the provider expects';
              
              // Log the values being used for debugging
              console.log('Debug values for OAuth error:', {
                clientId,
                redirectUri,
                codeLength: code ? code.length : 0
              });
            }
          }
        }
        
        return res.status(response.status).json({
          message: errorMessage,
          details: errorDetails
        });
      }
      
      console.log('API Success:', JSON.stringify(result, null, 2));

      // Now update the embed token with successful connection status
      try {
        const baseUrl = process.env.BASE_URL || 'https://platform-backend.inhotel.io';
        const updateEndpoint = `${baseUrl}/public/v1/embed-tokens/update`;
        console.log(`Updating embed token status at: ${updateEndpoint}`);
        
        const updatePayload = {
          sessionId: sessionId,
          response: {
            isConnected: true,
            connection: result // Include the full connection result
          }
        };
        
        console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
        
        const updateResponse = await fetch(updateEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pica-Secret': secret || process.env.X_PICA_SECRET || ''
          },
          body: JSON.stringify(updatePayload)
        });
        
        console.log('Update response status:', updateResponse.status);
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('Successfully updated embed token:', JSON.stringify(updateResult, null, 2));
        } else {
          const errorText = await updateResponse.text();
          console.error('Failed to update embed token:', updateResponse.status, errorText);
        }
      } catch (updateError) {
        console.error('Error updating embed token:', updateError);
        // Continue anyway since the main connection was successful
      }
      
      return res.status(200).json({
        success: true,
        data: result
      });
      
    } finally {
      // Always close the MongoDB connection
      await client.close();
      console.log('MongoDB connection closed');
    }
    
  } catch (error) {
    console.error('Error processing callback:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: String(error)
    });
  }
} 