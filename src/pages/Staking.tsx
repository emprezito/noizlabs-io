import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Users } from 'lucide-react';

const Staking = () => {
  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-strong border-border glow-primary">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-gradient">Coming Soon</h1>
                <p className="text-xl text-muted-foreground">
                  Staking features are currently under development
                </p>
              </div>

              <div className="glass rounded-lg p-6 space-y-4">
                <p className="text-lg">
                  Join our Telegram community for the latest updates and announcements!
                </p>
                <Button 
                  variant="glow" 
                  size="lg"
                  className="w-full"
                  onClick={() => window.open('https://t.me/noizlabs_io', '_blank')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Telegram Community
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Stay tuned for exciting staking rewards and benefits!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Staking;
