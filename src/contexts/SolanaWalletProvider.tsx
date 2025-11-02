import { FC, ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Extend Window interface for Phantom
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
      };
    };
  }
}

// Helper to detect mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper to check if already in Phantom browser
const isInPhantomBrowser = () => {
  return window.phantom?.solana?.isPhantom;
};

// Helper to redirect to Phantom browser
const redirectToPhantom = () => {
  const currentUrl = window.location.href;
  const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=https://phantom.app`;
  window.location.href = phantomDeepLink;
};

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Explicitly include both Phantom and Solflare for better mobile support
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Show redirect banner on mobile if not in Phantom
  useEffect(() => {
    if (isMobileDevice() && !isInPhantomBrowser()) {
      // Intercept wallet connection attempts
      const handleWalletClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if clicked element or parent is a wallet button
        const walletButton = target.closest('button[class*="wallet"]') || 
                           target.closest('button[class*="connect"]') ||
                           target.closest('button[class*="Connect"]');
        
        if (walletButton) {
          e.preventDefault();
          e.stopPropagation();
          // Immediately redirect to Phantom browser
          redirectToPhantom();
        }
      };

      document.addEventListener('click', handleWalletClick, true);
      return () => document.removeEventListener('click', handleWalletClick, true);
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
