import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, Radio, Rocket, Store, Coins } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Radio className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gradient">NoizLabs</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/arena" className="text-sm font-medium hover:text-primary transition-colors">
              Arena
            </Link>
            <Link to="/launchpad" className="text-sm font-medium hover:text-primary transition-colors">
              Launchpad
            </Link>
            <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link to="/staking" className="text-sm font-medium hover:text-primary transition-colors">
              Staking
            </Link>
          </div>

          <Button variant="neon" size="sm">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
};
