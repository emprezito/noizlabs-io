import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Upload, Coins, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AudioPlayer } from '@/components/AudioPlayer';

const Admin = () => {
  const { walletAddress, isConnected } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [formData, setFormData] = useState({
    audioFile: null as File | null,
    tokenName: '',
    symbol: '',
    supply: '',
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, audioFile: file });
      setAudioUrl(URL.createObjectURL(file));
      toast.success('Audio file uploaded!');
    }
  };

  const handleMintToken = async () => {
    if (!isConnected || !walletAddress) {
      setVisible(true);
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.audioFile || !formData.tokenName || !formData.symbol || !formData.supply) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsMinting(true);

    try {
      // 1. Upload audio to Supabase Storage
      const fileName = `${Date.now()}-${formData.audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-clips')
        .upload(fileName, formData.audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-clips')
        .getPublicUrl(fileName);

      // 2. Create metadata (stored locally, no need to upload)
      const metadata = {
        name: formData.tokenName,
        symbol: formData.symbol,
        description: `Audio token for ${formData.tokenName}`,
        audio: publicUrl,
        attributes: [
          { trait_type: 'Type', value: 'Audio Token' },
          { trait_type: 'Supply', value: formData.supply },
        ],
      };

      // 3. Mint SPL Token on Solana Devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Create a new mint authority (for demo purposes, in production use proper keypair management)
      const mintAuthority = Keypair.generate();
      
      // Airdrop SOL for gas fees (devnet only)
      const airdropSignature = await connection.requestAirdrop(
        new PublicKey(walletAddress),
        1000000000 // 1 SOL
      );
      await connection.confirmTransaction(airdropSignature);

      // Create the mint
      const mint = await createMint(
        connection,
        mintAuthority,
        mintAuthority.publicKey,
        null,
        9, // Decimals
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
      );

      // Get or create token account for user
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        new PublicKey(walletAddress)
      );

      // Mint tokens to user's account
      const supplyAmount = BigInt(parseFloat(formData.supply) * 1e9);
      await mintTo(
        connection,
        mintAuthority,
        mint,
        tokenAccount.address,
        mintAuthority,
        supplyAmount
      );

      const newToken = {
        name: formData.tokenName,
        symbol: formData.symbol,
        supply: formData.supply,
        audioUrl: publicUrl,
        metadata,
        mintAddress: mint.toBase58(),
        timestamp: new Date().toISOString(),
      };

      setMintedTokens([...mintedTokens, newToken]);
      
      toast.success(`🎉 Token minted! Mint Address: ${mint.toBase58().slice(0, 8)}...`, {
        duration: 5000,
      });

      // Reset form
      setFormData({
        audioFile: null,
        tokenName: '',
        symbol: '',
        supply: '',
      });
      setAudioUrl(null);
    } catch (error: any) {
      console.error('Minting error:', error);
      toast.error(`Failed to mint token: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">Admin Token Minting</h1>
          <p className="text-xl text-muted-foreground">
            Mint audio tokens directly to your wallet for testing
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Minting Form */}
          <Card className="glass-strong border-border glow-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Mint Audio Token
              </CardTitle>
              <CardDescription>Free minting for testing on Devnet</CardDescription>
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
                      MP3, WAV, OGG (max 10MB)
                    </p>
                  </label>
                </div>
                {audioUrl && (
                  <div className="mt-4 glass rounded-lg p-4">
                    <AudioPlayer audioUrl={audioUrl} title={formData.tokenName || 'Preview'} />
                  </div>
                )}
              </div>

              {/* Token Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Token Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Boom Sound"
                  value={formData.tokenName}
                  onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                />
              </div>

              {/* Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., $BOOM"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Supply */}
              <div className="space-y-2">
                <Label htmlFor="supply">Total Supply *</Label>
                <Input
                  id="supply"
                  type="number"
                  placeholder="e.g., 1000000"
                  value={formData.supply}
                  onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                />
              </div>

              <Button 
                variant="hero" 
                className="w-full" 
                size="lg" 
                onClick={handleMintToken}
                disabled={isMinting}
              >
                {isMinting ? (
                  <>Minting...</>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Mint Token (Free)
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Tokens will be minted on Solana Devnet and sent to your connected wallet
              </p>
            </CardContent>
          </Card>

          {/* Minted Tokens */}
          <Card className="glass-strong border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Minted Tokens
              </CardTitle>
              <CardDescription>View your minted audio tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {mintedTokens.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No tokens minted yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {mintedTokens.map((token, index) => (
                    <Card key={index} className="glass border-border">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{token.name}</h3>
                            <p className="text-sm text-primary">{token.symbol}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Supply</p>
                            <p className="font-semibold">{token.supply}</p>
                          </div>
                        </div>

                        <AudioPlayer audioUrl={token.audioUrl} />

                        <div className="glass rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mint Address</span>
                            <span className="font-mono">{token.mintAddress.slice(0, 8)}...{token.mintAddress.slice(-4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Network</span>
                            <span>Devnet</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time</span>
                            <span>{new Date(token.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
