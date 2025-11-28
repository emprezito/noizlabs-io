import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { Radio, Zap, TrendingUp, Shield } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="animate-float">
            <div className="inline-block p-4 rounded-full glass-strong glow-primary mb-8">
              <Radio className="w-16 h-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-gradient">
            NoizLabs
          </h1>
          
          <p className="text-2xl md:text-3xl font-semibold mb-4">
            The Audio Meme Launchpad for Degens and Creators
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Turning viral audio clips into tradeable tokens — no code required. 
            Join the revolution where sound meets DeFi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/arena">
              <Button variant="hero" size="xl">
                <Zap className="w-5 h-5" />
                Enter the NoizHub
              </Button>
            </Link>
            <Link to="/launchpad">
              <Button variant="glow" size="xl">
                <TrendingUp className="w-5 h-5" />
                Create Token
              </Button>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <WaveformVisualizer className="w-full opacity-80" />
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-strong rounded-2xl p-12 glow-primary">
              <h2 className="text-4xl font-bold mb-6 text-center">The Problem</h2>
              <p className="text-xl text-center text-muted-foreground mb-8">
                Viral audio clips go viral but creators see no value. Copyright issues block innovation. 
                There's no infrastructure to tokenize and trade audio memes.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="glass rounded-xl p-6 text-center">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Viral Audio</h3>
                  <p className="text-sm text-muted-foreground">Billions of plays, zero value capture</p>
                </div>
                <div className="glass rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-accent" />
                  <h3 className="font-semibold mb-2">Copyright Hell</h3>
                  <p className="text-sm text-muted-foreground">Legal barriers block creativity</p>
                </div>
                <div className="glass rounded-xl p-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-secondary" />
                  <h3 className="font-semibold mb-2">No Market</h3>
                  <p className="text-sm text-muted-foreground">Audio memes can't be traded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-16 text-gradient">How It Works</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-strong rounded-xl p-8 hover:glow-primary transition-all">
              <div className="text-4xl font-bold text-primary mb-4">01</div>
              <h3 className="text-xl font-semibold mb-3">Battle</h3>
              <p className="text-muted-foreground">
                Upload audio memes, vote on the best, and compete for weekly rewards
              </p>
            </div>

            <div className="glass-strong rounded-xl p-8 hover:glow-secondary transition-all">
              <div className="text-4xl font-bold text-secondary mb-4">02</div>
              <h3 className="text-xl font-semibold mb-3">Launch</h3>
              <p className="text-muted-foreground">
                Create your own audio token with embedded metadata and custom tokenomics
              </p>
            </div>

            <div className="glass-strong rounded-xl p-8 hover:glow-accent transition-all">
              <div className="text-4xl font-bold text-accent mb-4">03</div>
              <h3 className="text-xl font-semibold mb-3">Trade</h3>
              <p className="text-muted-foreground">
                Buy and sell audio tokens on our DEX-style marketplace with real liquidity
              </p>
            </div>

            <div className="glass-strong rounded-xl p-8 hover:glow-primary transition-all">
              <div className="text-4xl font-bold text-primary mb-4">04</div>
              <h3 className="text-xl font-semibold mb-3">Earn</h3>
              <p className="text-muted-foreground">
                Stake $NOIZ tokens and earn $FANFI rewards from platform activity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass-strong rounded-2xl p-12 text-center glow-secondary">
            <h2 className="text-4xl font-bold mb-6">Ready to Make Some Noiz?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators and degens in the first audio meme ecosystem
            </p>
            <Link to="/arena">
              <Button variant="hero" size="xl">
                <Zap className="w-5 h-5" />
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
