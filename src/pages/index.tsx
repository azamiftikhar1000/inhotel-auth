export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            OAuth Callback Service
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This service handles OAuth callbacks for third-party integrations.
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How It Works
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p className="mb-2">
                  This service acts as a redirect URI for OAuth authorization flows.
                </p>
                <p className="mb-2">
                  When an OAuth provider redirects to this service with an authorization code, 
                  the service retrieves necessary information from the database and completes the OAuth flow.
                </p>
                <p>
                  No action is needed on this page. All OAuth callbacks are automatically processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 