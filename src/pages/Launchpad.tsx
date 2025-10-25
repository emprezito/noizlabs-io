import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Rocket, Upload, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

const Launchpad = () => {
  const [formData, setFormData] = useState({
    audioFile: null as File | null,
    tokenName: '',
    symbol: '',
    supply: '',
    liquidity: '',
  });

  const [previewToken, setPreviewToken] = useState<any>(null);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, audioFile: file });
      toast.success('Audio file uploaded!');
    }
  };

  const handleLaunchToken = () => {
    if (!formData.audioFile || !formData.tokenName || !formData.symbol) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newToken = {
      name: formData.tokenName,
      symbol: formData.symbol,
      supply: formData.supply,
      liquidity: formData.liquidity,
      audioName: formData.audioFile.name,
      price: '0.00001 SOL',
      marketCap: '$0',
    };

    setPreviewToken(newToken);
    toast.success('Token preview generated!');
  };

  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">Token Launchpad</h1>
          <p className="text-xl text-muted-foreground">
            Turn your audio memes into tradeable tokens in minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Launch Form */}
          <Card className="glass-strong border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Create Your Token
              </CardTitle>
              <CardDescription>Fill in the details to launch your audio token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audio Upload */}
              <div className="space-y-2">
                <Label htmlFor="audio">Audio Clip *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio"
                  />
                  <label htmlFor="audio" className="cursor-pointer">
                    <p className="text-sm font-medium">
                      {formData.audioFile ? formData.audioFile.name : 'Upload audio clip'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3, WAV, OGG (max 30s)
                    </p>
                  </label>
                </div>
              </div>

              {/* Token Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Token Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Emotional Damage"
                  value={formData.tokenName}
                  onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                />
              </div>

              {/* Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., $EMOTIONAL"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Supply */}
              <div className="space-y-2">
                <Label htmlFor="supply">Total Supply</Label>
                <Input
                  id="supply"
                  type="number"
                  placeholder="e.g., 1000000000"
                  value={formData.supply}
                  onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                />
              </div>

              {/* Initial Liquidity */}
              <div className="space-y-2">
                <Label htmlFor="liquidity">Initial Liquidity (SOL)</Label>
                <Input
                  id="liquidity"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.liquidity}
                  onChange={(e) => setFormData({ ...formData, liquidity: e.target.value })}
                />
              </div>

              <div className="glass rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Remixing
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your audio will be slightly modified to avoid copyright issues while maintaining its essence
                </p>
              </div>

              <Button variant="hero" className="w-full" size="lg" onClick={handleLaunchToken}>
                <Rocket className="w-5 h-5" />
                Generate Preview
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="glass-strong border-border glow-primary">
              <CardHeader>
                <CardTitle>Token Preview</CardTitle>
                <CardDescription>
                  {previewToken ? 'Your token is ready to launch!' : 'Fill the form to see your token preview'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewToken ? (
                  <div className="space-y-6">
                    <div className="aspect-square rounded-xl glass-strong flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                          <Sparkles className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{previewToken.name}</h3>
                        <p className="text-lg text-primary font-semibold">{previewToken.symbol}</p>
                      </div>
                    </div>

                    <div className="glass rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Audio</span>
                        <span className="font-medium">{previewToken.audioName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supply</span>
                        <span className="font-medium">{previewToken.supply || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Liquidity</span>
                        <span className="font-medium">{previewToken.liquidity || '0'} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-medium text-primary">{previewToken.price}</span>
                      </div>
                    </div>

                    <Button 
                      variant="hero" 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowComingSoonDialog(true)}
                    >
                      <Rocket className="w-5 h-5" />
                      Launch Token on Solana
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Estimated gas: ~0.01 SOL • Token will be visible on marketplace in ~30s
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl glass flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No preview yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="glass-strong border-border">
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <p>Upload your audio meme (we'll AI-remix it for copyright safety)</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <p>Set token parameters and initial liquidity</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <p>Token is minted on Solana with embedded audio metadata</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <p>Instantly tradeable on our marketplace and DEX</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <DialogContent className="sm:max-w-md glass-strong border-2 border-primary/50 glow-primary">
          <DialogHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center glow-primary animate-pulse">
              <Rocket className="w-10 h-10" />
            </div>
            <DialogTitle className="text-3xl font-bold text-gradient">
              Audio Token Creation
            </DialogTitle>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-primary animate-pulse">
                Coming Soon!
              </p>
              <DialogDescription className="text-base">
                You will soon be able to launch your audio clips as tokens on Solana. 
                Be among the first to know when we go live!
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="glass rounded-lg p-4 space-y-2 border border-primary/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="w-4 h-4" />
                <span>What to Expect:</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                <li>Instant token creation on Solana</li>
                <li>AI-powered audio remixing</li>
                <li>Automatic DEX liquidity pools</li>
                <li>Trade on our marketplace</li>
              </ul>
            </div>

            <Button 
              variant="hero" 
              className="w-full"
              size="lg"
              onClick={() => window.open('https://t.me/noizlabs_io', '_blank')}
            >
              <Send className="w-5 h-5" />
              Join Telegram Community
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Get exclusive early access and launch updates
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Launchpad;
