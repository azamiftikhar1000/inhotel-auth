import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function ErrorPage() {
  const router = useRouter();
  const { error, error_description } = router.query;

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have access to this resource.",
    Verification: "The verification link may have been used or is invalid.",
    OAuthSignin: "Error occurred while trying to start the OAuth flow.",
    OAuthCallback: "Error occurred during OAuth callback. The authorization code may be invalid or expired.",
    OAuthCreateAccount: "Could not create OAuth provider user in the database.",
    EmailCreateAccount: "Could not create email provider user in the database.",
    Callback: "Error occurred during the callback.",
    OAuthAccountNotLinked: "The email on this account is already linked to another account.",
    EmailSignin: "Error sending the email for sign in.",
    CredentialsSignin: "The sign in failed. Check the details you provided are correct.",
    SessionRequired: "Please sign in to access this page.",
    Default: "An unexpected error occurred.",
  };

  const errorMessage = errorMessages[error as string] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorMessage}
          </p>
          {error_description && (
            <p className="mt-2 text-center text-sm text-red-600">
              Details: {error_description}
            </p>
          )}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                console.log('Retrying authentication from error page...');
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