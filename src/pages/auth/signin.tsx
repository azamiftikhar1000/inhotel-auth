import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function SignIn() {
  useEffect(() => {
    signIn('apaleo', { callbackUrl: '/' });
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