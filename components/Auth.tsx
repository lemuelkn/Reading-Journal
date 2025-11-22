import React, { useState } from 'react';
import { supabase, isDemoMode } from '../services/supabaseClient';
import { Button } from './Button';

interface AuthProps {
  onDemoLogin?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isDemoMode) {
      // Simulate network delay for demo
      setTimeout(() => {
        setLoading(false);
        if (onDemoLogin) onDemoLogin();
      }, 800);
      return;
    }

    try {
      // Use Magic Link (OTP) for login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your email for the magic link to log in!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-sm border border-stone-200">
        <div className="text-center">
          <span className="text-4xl">🕯️</span>
          <h2 className="mt-4 text-3xl font-serif font-bold text-stone-900">
            Lumina Journal
          </h2>
          <p className="mt-2 text-sm text-stone-500 italic font-sans">
            {isDemoMode 
              ? 'A space for your thoughts. (Demo Mode)' 
              : 'A reflective space for your reading journey.'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {!isDemoMode && (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-stone-300 placeholder-stone-400 text-stone-900 bg-white focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm font-sans"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {message && (
            <div className={`text-sm p-3 rounded border font-sans ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
              {message.text}
            </div>
          )}

          {isDemoMode && (
            <div className="bg-stone-50 p-3 rounded border border-stone-200 text-sm text-stone-600 mb-4 font-sans">
              <strong>Note:</strong> Logging in will use <strong>Local Storage</strong>.
            </div>
          )}

          <div>
            <Button type="submit" isLoading={loading} className="w-full">
              {isDemoMode ? 'Enter Library' : 'Send Magic Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};