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

  // Handle Phantom mobile deep linking
  useEffect(() => {
    if (isMobileDevice() && !isInPhantomBrowser()) {
      // Detect if user clicks wallet connect button
      const handleWalletClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if clicked element or parent is a wallet button
        const walletButton = target.closest('button[class*="wallet"]') || 
                           target.closest('button[class*="connect"]');
        
        if (walletButton) {
          // Small delay to let the wallet modal potentially open
          setTimeout(() => {
            // Check if Phantom option might be selected
            const phantomOption = document.querySelector('[class*="phantom"]');
            if (phantomOption) {
              // Redirect to Phantom browser
              const currentUrl = window.location.href;
              const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
              window.location.href = phantomDeepLink;
            }
          }, 100);
        }
      };

      document.addEventListener('click', handleWalletClick);
      return () => document.removeEventListener('click', handleWalletClick);
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
