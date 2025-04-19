import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkMongo = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/check-mongo');
      const data = await response.json();
      setMongoStatus(data);
    } catch (err) {
      setError(String(err));
      console.error('Error checking MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Page</h1>
        
        <div className="mb-8 p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-4">MongoDB Connection Test</h2>
          
          <button 
            onClick={checkMongo}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check MongoDB Connection'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {mongoStatus && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">
                Status: 
                <span className={mongoStatus.success ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                  {mongoStatus.success ? "Connected" : "Failed"}
                </span>
              </h3>
              
              <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre className="text-sm">{JSON.stringify(mongoStatus, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Next.js Runtime:</div>
            <div>{typeof window === 'undefined' ? 'Server' : 'Client'}</div>
            
            <div className="font-medium">Base URL:</div>
            <div>{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
            
            <div className="font-medium">Current Path:</div>
            <div>{typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 