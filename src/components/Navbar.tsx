import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Radio, Sparkles, Home, Trophy, Rocket, ShoppingBag, ArrowLeftRight, Coins, ListChecks, Loader2, User } from 'lucide-react';
import { useArena } from '@/contexts/ArenaContext';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

export const Navbar = () => {
  const { userPoints, fetchUserPoints, profiles } = useArena();
  const { walletAddress, isConnected, disconnect } = useSolanaWallet();
  const { isAuthenticated, isAuthenticating } = useWalletAuth();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchUserPoints(walletAddress);
    }
  }, [walletAddress]);

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      // On mobile, use deep linking to Phantom
      if (isMobile) {
        // Check if Phantom is installed by looking for the provider
        const isPhantomInstalled = 'phantom' in window || 'solana' in window;
        
        if (!isPhantomInstalled) {
          // User doesn't have Phantom, redirect to install or open in Phantom browser
          toast.info('Opening Phantom Wallet', {
            description: 'You will be redirected to Phantom. If not installed, please install it first.',
          });
          
          // Try to open in Phantom browser
          const currentUrl = window.location.href;
          const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
          
          // Small delay for toast to show
          setTimeout(() => {
            window.location.href = phantomUrl;
          }, 500);
        } else {
          // Phantom is installed, use the modal
          setVisible(true);
        }
      } else {
        // Desktop: use the normal modal
        setVisible(true);
      }
    }
  };

  const getWalletButtonText = () => {
    if (isAuthenticating) return 'Authenticating...';
    if (!isConnected) return 'Connect';
    if (isConnected && !isAuthenticated) return 'Signing...';
    return `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}`;
  };

  const handlePointsClick = () => {
    if (walletAddress) {
      const userProfile = profiles.find(p => p.wallet_address === walletAddress);
      if (userProfile) {
        navigate(`/profile/${userProfile.username}`);
      }
    }
  };

  const navLinks = [
    { to: '/arena', label: 'Arena', icon: Trophy },
    { to: '/launchpad', label: 'Launchpad', icon: Rocket },
    { to: '/marketplace', label: 'Market', icon: ShoppingBag },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { to: '/staking', label: 'Staking', icon: Coins },
  ];

  const desktopNavLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/arena', label: 'Arena', icon: Trophy },
    { to: '/launchpad', label: 'Launchpad', icon: Rocket },
    { to: '/marketplace', label: 'Market', icon: ShoppingBag },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { to: '/staking', label: 'Staking', icon: Coins },
  ];

  if (isTabletOrMobile) {
    return (
      <>
        {/* Top bar for mobile and tablet */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
              </Link>

              {/* Wallet Address (center) */}
              <Button variant="ghost" size="sm" onClick={handleWalletClick} className="text-xs px-2" disabled={isAuthenticating}>
                {isAuthenticating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wallet className="w-3 h-3 mr-1" />}
                {getWalletButtonText()}
              </Button>

              {/* Profile & Points (right) */}
              {isConnected && isAuthenticated && (
                <div 
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handlePointsClick}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <Badge 
                    variant="outline" 
                    className="border-primary text-primary px-2 py-1 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {userPoints}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom navigation for mobile and tablet */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border pb-safe">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </>
    );
  }

  // Desktop navbar (original design)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gradient">NoizLabs</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {desktopNavLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm font-medium hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isConnected && isAuthenticated && (
              <Badge 
                variant="outline" 
                className="border-primary text-primary px-3 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={handlePointsClick}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {userPoints} Points
              </Badge>
            )}
            <Button variant="neon" size="sm" onClick={handleWalletClick} disabled={isAuthenticating}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnected 
                    ? `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}` 
                    : 'Connect Wallet'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};