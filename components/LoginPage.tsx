
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

interface LoginPageProps {
  // onDeveloperBypassLogin prop removed
}

// Google Icon SVG
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-5 h-5 mr-2"} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);


export const LoginPage: React.FC<LoginPageProps> = ({ 
  // onDeveloperBypassLogin prop removed
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // For success messages like "Check your email"

  const handleEmailPasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
    }
    // On success, onAuthStateChange in App.tsx will handle navigation
    setIsLoading(false);
  };

  const handleEmailPasswordSignUp = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // You can add options here, for example, to redirect the user
      // options: {
      //   emailRedirectTo: window.location.origin, // Redirect to your app after email confirmation
      // }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user && data.user.identities?.length === 0) {
      // This can happen if email confirmation is required and the user already exists but is not confirmed.
      // Supabase might return a user object with an empty identities array.
      setMessage("User already exists but is not confirmed. Please check your email to confirm your account or try signing in.");
      setError("Confirmation pending or user exists."); // Or a more user-friendly message
    } else if (data.session) {
      // User signed up and is logged in (e.g., if email confirmation is disabled or auto-confirmed)
      setMessage("Sign up successful! You are now logged in.");
    }
     else if (data.user) {
      // User signed up, email confirmation likely required
      setMessage("Sign up successful! Please check your email to confirm your account.");
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    // Simplified: Removed options. Supabase will use its default redirect flow.
    // Ensure your Supabase dashboard has the correct Site URL and Additional Redirect URLs configured
    // if necessary, and that these match what's in your Google Cloud Console.
    // The primary redirect URI in Google Cloud Console should be:
    // https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (googleError) {
      setError(googleError.message);
      setIsLoading(false);
    }
    // On success, Supabase handles the redirect and onAuthStateChange in App.tsx will update the session
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 sm:p-10 md:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-blue-400 text-center">
          AI Chat Assistant
        </h1>
        
        <form onSubmit={handleEmailPasswordSignIn} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md" role="alert">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-400 bg-green-900/50 p-2 rounded-md" role="status">{message}</p>
          )}

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="flex-1 w-full justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleEmailPasswordSignUp}
              disabled={isLoading || !email || !password}
              className="flex-1 w-full justify-center py-3 px-4 border border-blue-500 rounded-lg shadow-sm text-sm font-medium text-blue-300 hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        </div>
        
        {/* Developer Bypass Login section removed */}
        
        {/* Removed informational text: "Your conversations will be stored locally..." */}
      </div>
       <footer className="absolute bottom-4 text-center w-full text-gray-600 text-xs">
          Made by Joaco & Pol
        </footer>
    </div>
  );
};
