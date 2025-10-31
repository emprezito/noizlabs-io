import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Users, ArrowRightLeft, TrendingUp, Shield, Zap } from 'lucide-react';
import { SwapDialog } from '@/components/SwapDialog';

const Swap = () => {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-gradient">NoizLabs DEX</h1>
            <p className="text-xl text-muted-foreground">
              Fast, secure, and decentralized token swaps on Solana
            </p>
          </div>

          {/* Main Swap Section */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Swap Card */}
            <div className="lg:col-span-2">
              <Card className="glass-strong border-border glow-primary">
                <CardContent className="pt-12 pb-12">
                  <div className="max-w-md mx-auto space-y-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Coins className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="space-y-4 text-center">
                      <h2 className="text-3xl font-bold">Swap Tokens</h2>
                      <p className="text-muted-foreground">
                        Trade your tokens instantly with minimal fees and maximum security
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        variant="glow" 
                        size="lg"
                        className="w-full"
                        onClick={() => setSwapDialogOpen(true)}
                      >
                        <ArrowRightLeft className="w-5 h-5 mr-2" />
                        Open Swap Interface
                      </Button>

                      <div className="glass rounded-lg p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">24h Volume</span>
                          <span className="font-semibold">$0</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Trades</span>
                          <span className="font-semibold">0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Lightning Fast</h3>
                      <p className="text-sm text-muted-foreground">
                        Instant swaps powered by Solana's high-speed network
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary/20 shrink-0">
                      <Shield className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Secure & Safe</h3>
                      <p className="text-sm text-muted-foreground">
                        Non-custodial swaps with verified smart contracts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/20 shrink-0">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Best Rates</h3>
                      <p className="text-sm text-muted-foreground">
                        Competitive pricing with minimal slippage
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Community Section */}
          <Card className="glass-strong border-border">
            <CardContent className="pt-8 pb-8">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-2xl font-bold">Join Our Community</h2>
                <p className="text-muted-foreground">
                  Stay updated with the latest developments, trading strategies, and platform updates
                </p>
                <Button 
                  variant="glow" 
                  size="lg"
                  className="w-full max-w-md"
                  onClick={() => window.open('https://t.me/noizlabs_io', '_blank')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Telegram Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SwapDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
      />
    </div>
  );
};

export default Swap;
