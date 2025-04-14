import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

export default function SignIn() {
  const router = useRouter();
  const { error, error_description } = router.query;

  useEffect(() => {
    if (error) {
      console.error('Authentication error:', { error, error_description });
      return;
    }

    console.log('Starting Apaleo sign in...');
    signIn('apaleo', {
      callbackUrl: '/',
      redirect: true,
    }).catch((error) => {
      console.error('SignIn error:', error);
    });
  }, [error, error_description]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {error ? 'Authentication Error' : 'Redirecting to Apaleo...'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error
              ? `Error: ${error}${error_description ? ` - ${error_description}` : ''}`
              : 'Please wait while we redirect you to the Apaleo login page.'}
          </p>
          {error && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  console.log('Retrying authentication with apaleo...');
                  signIn('apaleo', { 
                    callbackUrl: 'https://inhotel-auth-4fbefd0bd04c.herokuapp.com/',
                    redirect: true
                  });
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Disable automatic static optimization
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
}; 