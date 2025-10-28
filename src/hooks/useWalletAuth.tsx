import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bs58 from 'bs58';

export const useWalletAuth = () => {
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // If we have a wallet connected but no session, authenticate
      if (connected && publicKey && !session && signMessage) {
        await authenticate();
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_OUT') {
        disconnect();
      }
    });

    return () => subscription.unsubscribe();
  }, [connected, publicKey, disconnect, signMessage]);

  const authenticate = async (username?: string) => {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsAuthenticating(true);

    try {
      const walletAddress = publicKey.toBase58();
      
      // Create message to sign
      const message = `Sign this message to authenticate with NoizLabs.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature from wallet
      console.log('Requesting signature...');
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      console.log('Calling authenticate-wallet function...');
      // Send to backend for verification
      const { data, error } = await supabase.functions.invoke('authenticate-wallet', {
        body: {
          walletAddress,
          signature: signatureBase58,
          message,
          username,
        },
      });

      if (error) {
        console.error('Authentication error:', error);
        toast.error('Authentication failed');
        return false;
      }

      console.log('Auth response:', data);

      if (data.success && data.properties?.hashed_token) {
        // Exchange the magic link token for a session
        const { error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.properties.hashed_token,
          type: 'magiclink',
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Failed to create session');
          return false;
        }

        setIsAuthenticated(true);
        toast.success(data.isNewUser ? 'Welcome to NoizLabs!' : 'Welcome back!');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Signature rejected');
      } else {
        toast.error('Authentication failed: ' + (error.message || 'Unknown error'));
      }
      
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await disconnect();
    toast.success('Signed out successfully');
  };

  return {
    authenticate,
    signOut,
    isAuthenticating,
    isAuthenticated,
    walletAddress: publicKey?.toBase58() || null,
  };
};
