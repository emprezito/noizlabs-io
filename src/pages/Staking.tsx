import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Coins, TrendingUp, Clock, Gift } from 'lucide-react';
import { toast } from 'sonner';

const Staking = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakedBalance] = useState('25,000');
  const [pendingRewards] = useState('1,284.56');

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success(`Successfully staked ${stakeAmount} $NOIZ!`);
    setStakeAmount('');
  };

  const handleClaim = () => {
    toast.success(`Claimed ${pendingRewards} $FANFI!`);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">Staking</h1>
          <p className="text-xl text-muted-foreground">
            Stake $NOIZ, earn $FANFI rewards from platform activity
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-strong border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stakedBalance}</div>
                    <div className="text-sm text-muted-foreground">Your Stake</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">42.5%</div>
                    <div className="text-sm text-muted-foreground">APR</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <Gift className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{pendingRewards}</div>
                    <div className="text-sm text-muted-foreground">$FANFI Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5d 12h</div>
                    <div className="text-sm text-muted-foreground">Next Reward</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stake Card */}
            <Card className="glass-strong border-border glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Stake $NOIZ
                </CardTitle>
                <CardDescription>Lock your tokens to earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="glass rounded-lg p-6">
                  <div className="text-sm text-muted-foreground mb-2">Available Balance</div>
                  <div className="text-3xl font-bold mb-4">50,000 $NOIZ</div>
                  <div className="text-sm text-muted-foreground">
                    ≈ $2,500 USD
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Stake</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0.0"
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setStakeAmount('50000')}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period</span>
                      <span className="font-semibold">Flexible</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">APR</span>
                      <span className="font-semibold text-primary">42.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Daily</span>
                      <span className="font-semibold text-secondary">
                        {stakeAmount ? (parseFloat(stakeAmount) * 0.001165).toFixed(2) : '0'} $FANFI
                      </span>
                    </div>
                  </div>

                  <Button variant="hero" className="w-full" size="lg" onClick={handleStake}>
                    Stake Now
                  </Button>
                </div>

                <div className="glass rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-accent" />
                    Staking Benefits
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Earn $FANFI from all platform trading fees
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      No lock period - unstake anytime
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Voting rights on platform governance
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Early access to new token launches
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Card */}
            <div className="space-y-6">
              <Card className="glass-strong border-border glow-secondary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Your Rewards
                  </CardTitle>
                  <CardDescription>Claim your earned $FANFI tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="glass rounded-lg p-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">Pending Rewards</div>
                    <div className="text-5xl font-bold mb-2 text-gradient">{pendingRewards}</div>
                    <div className="text-lg text-muted-foreground">$FANFI</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      ≈ $64.23 USD
                    </div>
                  </div>

                  <Button variant="neon" className="w-full" size="lg" onClick={handleClaim}>
                    <Gift className="w-5 h-5" />
                    Claim Rewards
                  </Button>

                  <div className="glass rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Claimed</span>
                      <span className="font-semibold">8,420 $FANFI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Reward In</span>
                      <span className="font-semibold">5d 12h 34m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reward Rate</span>
                      <span className="font-semibold text-primary">29.14 $FANFI/day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Staking Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
                    <div className="text-2xl font-bold">$12.5M</div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Stakers</div>
                    <div className="text-2xl font-bold">8,420</div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">$FANFI Distributed</div>
                    <div className="text-2xl font-bold">1.2M</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
