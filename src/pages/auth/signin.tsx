import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function SignIn() {
  useEffect(() => {
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(7);
    // Store the state in sessionStorage for verification later
    sessionStorage.setItem('oauth_state', state);

    // Define all required scopes
    const scopes = [
      'offline_access',
      'setup.read',
      'setup.write',
      'reservation.read',
      'reservation.write',
      'folio.read',
      'folio.write'
    ].join(' ');

    // Construct the apaleo authorization URL
    const authUrl = `https://identity.apaleo.com/connect/authorize?` +
      `response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&client_id=${process.env.NEXT_PUBLIC_APALEO_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APALEO_REDIRECT_URI || '')}` +
      `&state=${state}`;

    console.log('Redirecting to:', authUrl); // Add this for debugging
    // Redirect to apaleo login
    window.location.href = authUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redirecting to Apaleo...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we redirect you to the Apaleo login page.
          </p>
        </div>
      </div>
    </div>
  );
}

// Disable automatic static optimization
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
}; 