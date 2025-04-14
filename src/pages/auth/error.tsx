import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'invalid_state':
        return 'Invalid state parameter. This could be a security issue.';
      case 'RefreshAccessTokenError':
        return 'Failed to refresh access token. Please try signing in again.';
      case 'configuration_error':
        return 'Application configuration error. Please contact support.';
      case 'CredentialsSignin':
        return 'Authentication failed. Please check your credentials and try again.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error ? getErrorMessage(error as string) : 'An unknown error occurred'}
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
} 