import { useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, Settings } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';

// Common Solana tokens
const TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, icon: '◎' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, icon: '$' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, icon: '₮' },
];

export const SwapWidget = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('1.0');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // This is a placeholder - in production, you'd integrate with Jupiter or Raydium APIs
      console.log('Swap:', {
        from: fromToken.symbol,
        to: toToken.symbol,
        amount: fromAmount,
        slippage,
      });
      
      alert('Swap functionality coming soon! This will integrate with Jupiter aggregator for best rates.');
    } catch (error) {
      console.error('Swap error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border glow-primary w-full max-w-md mx-auto">
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Settings Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-gradient">Swap Tokens</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="touch-manipulation active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="glass rounded-lg p-3 md:p-4 space-y-2">
            <label className="text-sm text-muted-foreground">Slippage Tolerance (%)</label>
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              placeholder="1.0"
              className="touch-manipulation"
            />
          </div>
        )}

        {/* From Token */}
        <div className="glass rounded-lg p-3 md:p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">From</span>
            {connected && <span className="text-xs text-muted-foreground">Balance: 0.00</span>}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-lg md:text-2xl font-bold touch-manipulation"
            />
            <Button variant="outline" className="min-w-[100px] touch-manipulation active:scale-95">
              <span className="mr-2">{fromToken.icon}</span>
              {fromToken.symbol}
            </Button>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full glass border-2 touch-manipulation active:scale-90 active:rotate-180 transition-transform"
          >
            <ArrowDownUp className="w-5 h-5" />
          </Button>
        </div>

        {/* To Token */}
        <div className="glass rounded-lg p-3 md:p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">To</span>
            {connected && <span className="text-xs text-muted-foreground">Balance: 0.00</span>}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={toAmount}
              onChange={(e) => setToAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-lg md:text-2xl font-bold touch-manipulation"
            />
            <Button variant="outline" className="min-w-[100px] touch-manipulation active:scale-95">
              <span className="mr-2">{toToken.icon}</span>
              {toToken.symbol}
            </Button>
          </div>
        </div>

        {/* Swap Info */}
        {fromAmount && toAmount && (
          <div className="glass rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>1 {fromToken.symbol} ≈ 1.00 {toToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span>{slippage}%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          variant="glow"
          size="lg"
          className="w-full touch-manipulation active:scale-95"
          onClick={handleSwap}
          disabled={!connected || !fromAmount || loading}
        >
          {!connected ? 'Connect Wallet' : loading ? 'Swapping...' : 'Swap'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Jupiter Aggregator • Best rates guaranteed
        </p>
      </CardContent>
    </Card>
  );
};
