import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownUp, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';

interface SwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SwapDialog = ({ open, onOpenChange }: SwapDialogProps) => {
  const { walletAddress, isConnected } = useSolanaWallet();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('NOIZ');
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSwapping(true);
    
    try {
      // Simulate swap (replace with actual DEX integration)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Swap successful! ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`);
      onOpenChange(false);
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Calculate exchange rate (mock calculation)
  const calculateToAmount = (amount: string) => {
    if (!amount || isNaN(parseFloat(amount))) {
      setToAmount('');
      return;
    }
    // Mock exchange rate: 1 SOL = 100 NOIZ
    const rate = fromToken === 'SOL' ? 100 : 0.01;
    setToAmount((parseFloat(amount) * rate).toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Token Swap
          </DialogTitle>
          <DialogDescription>
            Swap your tokens instantly on NoizLabs DEX
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Token */}
          <div className="space-y-2">
            <Label htmlFor="from-amount">You Pay</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="from-amount"
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => {
                    setFromAmount(e.target.value);
                    calculateToAmount(e.target.value);
                  }}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {fromToken}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Balance: 0.00 {fromToken}</p>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFlipTokens}
              className="rounded-full"
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label htmlFor="to-amount">You Receive</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="to-amount"
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="pr-16 bg-muted"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {toToken}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Balance: 0.00 {toToken}</p>
          </div>

          {/* Exchange Rate Info */}
          <div className="glass rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1 SOL = 100 NOIZ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium">~0.001 SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className="font-medium text-green-500">&lt;0.01%</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 glass rounded-lg p-3 border border-yellow-500/20">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-500">
              ⚠️ TESTNET ONLY - This swap interface is currently on Devnet for testing purposes. No real value will be exchanged.
            </p>
          </div>

          {/* Swap Button */}
          <Button
            variant="glow"
            className="w-full"
            onClick={handleSwap}
            disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
          >
            {isSwapping ? 'Swapping...' : 'Swap Tokens'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
