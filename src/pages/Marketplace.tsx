import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Store, TrendingUp, TrendingDown, Play, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change24h: number;
  volume: string;
  liquidity: string;
  marketCap: string;
  holders: number;
}

const mockTokens: Token[] = [
  {
    id: '1',
    name: 'Emotional Damage',
    symbol: '$EMOTIONAL',
    price: '0.00042 SOL',
    change24h: 156.8,
    volume: '$48.2K',
    liquidity: '$12.5K',
    marketCap: '$420K',
    holders: 1337,
  },
  {
    id: '2',
    name: 'Its Corn',
    symbol: '$CORN',
    price: '0.00028 SOL',
    change24h: 89.4,
    volume: '$35.1K',
    liquidity: '$9.2K',
    marketCap: '$280K',
    holders: 892,
  },
  {
    id: '3',
    name: 'Bing Chilling',
    symbol: '$BING',
    price: '0.00015 SOL',
    change24h: -12.5,
    volume: '$22.8K',
    liquidity: '$6.8K',
    marketCap: '$150K',
    holders: 654,
  },
  {
    id: '4',
    name: 'Gangnam Style',
    symbol: '$GANGNAM',
    price: '0.00098 SOL',
    change24h: 234.2,
    volume: '$91.5K',
    liquidity: '$28.3K',
    marketCap: '$980K',
    holders: 2134,
  },
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleTrade = (token: Token) => {
    setSelectedToken(token);
    toast.success(`Trading pair opened: ${token.symbol}/SOL`);
  };

  const filteredTokens = mockTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">Marketplace</h1>
          <p className="text-xl text-muted-foreground">
            Trade audio meme tokens with real liquidity
          </p>
        </div>

        {/* Search & Stats */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search tokens or paste contract address..."
              className="pl-10 glass-strong"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-strong rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">42</div>
              <div className="text-sm text-muted-foreground">Active Tokens</div>
            </div>
            <div className="glass-strong rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-secondary">$2.1M</div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </div>
            <div className="glass-strong rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-accent">$8.9M</div>
              <div className="text-sm text-muted-foreground">Total Liquidity</div>
            </div>
            <div className="glass-strong rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">5.2K</div>
              <div className="text-sm text-muted-foreground">Traders</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-2">
            <Card className="glass-strong border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Live Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTokens.map((token) => (
                    <div
                      key={token.id}
                      className="glass rounded-lg p-4 hover:glass-strong transition-all cursor-pointer"
                      onClick={() => handleTrade(token)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                            <Play className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{token.name}</h4>
                            <p className="text-sm text-muted-foreground">{token.symbol}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            token.change24h > 0
                              ? 'border-primary text-primary'
                              : 'border-destructive text-destructive'
                          }
                        >
                          {token.change24h > 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {Math.abs(token.change24h)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Price</div>
                          <div className="font-semibold">{token.price}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Volume</div>
                          <div className="font-semibold">{token.volume}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Liquidity</div>
                          <div className="font-semibold">{token.liquidity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Holders</div>
                          <div className="font-semibold">{token.holders}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <Card className="glass-strong border-border glow-primary sticky top-24">
              <CardHeader>
                <CardTitle>
                  {selectedToken ? `Trade ${selectedToken.symbol}` : 'Select a Token'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedToken ? (
                  <div className="space-y-6">
                    {/* Chart Placeholder */}
                    <div className="aspect-square rounded-lg glass flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Chart Coming Soon</p>
                      </div>
                    </div>

                    {/* Token Info */}
                    <div className="glass rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">{selectedToken.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-semibold">{selectedToken.marketCap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Volume</span>
                        <span className="font-semibold">{selectedToken.volume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Liquidity</span>
                        <span className="font-semibold">{selectedToken.liquidity}</span>
                      </div>
                    </div>

                    {/* Buy/Sell */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">You Pay</label>
                        <div className="flex gap-2">
                          <Input placeholder="0.0" type="number" />
                          <Button variant="outline" size="sm" className="px-3">
                            SOL
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">You Receive</label>
                        <div className="flex gap-2">
                          <Input placeholder="0.0" type="number" />
                          <Button variant="outline" size="sm" className="px-3">
                            {selectedToken.symbol}
                          </Button>
                        </div>
                      </div>

                      <Button variant="hero" className="w-full" size="lg">
                        Swap Now
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      Slippage tolerance: 1% • Min. received displayed after amount input
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Select a token to trade</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
