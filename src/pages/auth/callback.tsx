import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const { code, state, scope } = router.query;
  const [status, setStatus] = useState('Processing');
  const [error, setError] = useState('');
  const [details, setDetails] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Helper function for logging
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!router.isReady) return;
        
        addLog('Callback page loaded');
        addLog(`Code param: ${code ? `${code.toString().substring(0, 10)}...` : 'missing'}`);
        addLog(`State param: ${state || 'missing'}`);
        
        if (!code || !state) {
          setError('Missing required parameters (code or state)');
          return;
        }

        // Get sessionId from state parameter
        const stateString = state as string;
        let sessionId = '';
        let type = '';
        let secret = '';
        addLog(`Parsing state parameter: ${stateString}`);
        
        // Split state string by # to get the secret
        const [statePart, secretPart] = stateString.split('#');
        if (secretPart) {
          secret = secretPart;
          addLog(`Found secret in state parameter`);
        }
        
        // If state is already in the format session_id::XXX::YYY, use it directly
        if (statePart.startsWith('session_id::')) {
          sessionId = statePart;
          addLog(`Using full state as session ID: ${sessionId}`);
        }
        // Format: airtable::session_id::GDeb6ZDUl_o::hr5KO0lNSuejI-iYrP-0ZA
        else {
          addLog('State does not start with session_id::, trying to parse parts');
          const stateParts = statePart.split('::');
          addLog(`Split state into ${stateParts.length} parts: ${JSON.stringify(stateParts)}`);
          
          type = stateParts[0];
          // Check if this is the airtable format with session_id component
          if (stateParts.length >= 4 && stateParts[1] === 'session_id') {
            // Reconstruct the full session ID
            sessionId = `session_id::${stateParts[2]}::${stateParts[3]}`;
            addLog(`Reconstructed full session ID: ${sessionId}`);
          } else {
            const errorMsg = `Unrecognized state format: ${stateString}`;
            addLog(`ERROR: ${errorMsg}`);
            setError(errorMsg);
            return;
          }
        }
        
        setStatus('Contacting server...');
        addLog('Making API request to /api/process-callback');
        
        // Call the API endpoint to process callback with MongoDB operations
        const response = await fetch('/api/process-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pica-Secret': secret || process.env.X_PICA_SECRET || '' // Add the secret to the request headers
          },
          body: JSON.stringify({
            sessionId,
            code,
            type,
            secret
          })
        });
        
        addLog(`API Response status: ${response.status}`);
        const result = await response.json();
        
        if (!response.ok) {
          const errorMsg = `Error: ${result.message || 'Unknown error'}`;
          addLog(`ERROR: ${errorMsg}`);
          addLog(`Error details: ${JSON.stringify(result, null, 2)}`);
          setError(errorMsg);
          setDetails(JSON.stringify(result, null, 2));
          return;
        }
        
        setStatus('Success');
        addLog('Authentication successful!');
        addLog(`API Success: ${JSON.stringify(result, null, 2)}`);
        
        // Redirect to a success page or show a success message
        addLog('Will close window in 5 seconds');
        setTimeout(() => {
          addLog('Closing window');
          window.close(); // Close the window after successful completion
        }, 5000);
        
      } catch (error) {
        const errorMsg = `Error processing callback: ${error}`;
        console.error(errorMsg);
        addLog(`EXCEPTION: ${errorMsg}`);
        setError(`${error}`);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router, code, state, scope]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-3xl w-full p-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {error ? 'Error' : status}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error ? error : 'Please wait while we complete the authentication process.'}
          </p>
          {status === 'Success' && (
            <p className="mt-4 text-center text-sm text-green-600">
              Authentication successful! This window will close automatically.
            </p>
          )}
          
          {/* Debug information */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Information</h3>
            
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-1">Query Parameters:</h4>
              <div className="bg-gray-100 p-2 rounded text-xs">
                <pre>{JSON.stringify({
                  code: code ? `${String(code).substring(0, 10)}...` : null,
                  state,
                  scope
                }, null, 2)}</pre>
              </div>
            </div>
            
            {logs.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-1">Logs:</h4>
                <div className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {logs.map((log, i) => (
                    <div key={i} className="text-xs font-mono">{log}</div>
                  ))}
                </div>
              </div>
            )}
            
            {details && (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-1">Response Details:</h4>
                <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-60 rounded">
                  {details}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 