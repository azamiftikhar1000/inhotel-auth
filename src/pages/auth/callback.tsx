import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

export default function Callback() {
  const router = useRouter();
  const { code, state } = router.query;

  useEffect(() => {
    const handleCallback = async () => {
      if (code && state) {
        // Verify the state parameter matches what we stored
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
          console.error('State mismatch - possible CSRF attack');
          await router.push('/auth/error?error=invalid_state');
          return;
        }

        // Clear the stored state
        sessionStorage.removeItem('oauth_state');

        // Sign in with NextAuth using the code
        const result = await signIn('apaleo', {
          code,
          redirect: false,
        });

        if (result?.error) {
          await router.push(`/auth/error?error=${result.error}`);
        } else {
          // Successful authentication
          await router.push('/');
        }
      }
    };

    if (code && state) {
      handleCallback();
    }
  }, [code, state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Processing...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
} 