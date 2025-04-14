import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function SignOut() {
  useEffect(() => {
    console.log('Starting sign out process...');
    signOut({
      callbackUrl: '/',
      redirect: true,
    }).catch((error) => {
      console.error('SignOut error:', error);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Signing out...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we sign you out.
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