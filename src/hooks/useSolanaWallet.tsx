import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';

// Helper to detect mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper to check if already in Phantom browser
const isInPhantomBrowser = () => {
  return (window as any).phantom?.solana?.isPhantom;
};

export const useSolanaWallet = () => {
  const { publicKey, connected, connect, disconnect, connecting } = useWallet();

  const handleConnect = useCallback(async () => {
    // If on mobile and not in Phantom browser, redirect to Phantom
    if (isMobileDevice() && !isInPhantomBrowser()) {
      const currentUrl = window.location.href;
      const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=https://phantom.app`;
      window.location.href = phantomDeepLink;
      return;
    }
    
    // Otherwise, proceed with normal connection
    await connect();
  }, [connect]);

  return {
    walletAddress: publicKey?.toBase58() || null,
    isConnected: connected,
    connect: handleConnect,
    disconnect,
    connecting,
  };
};
