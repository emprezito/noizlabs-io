import { useWallet } from '@solana/wallet-adapter-react';

export const useSolanaWallet = () => {
  const { publicKey, connected, connect, disconnect, connecting } = useWallet();

  return {
    walletAddress: publicKey?.toBase58() || null,
    isConnected: connected,
    connect,
    disconnect,
    connecting,
  };
};
