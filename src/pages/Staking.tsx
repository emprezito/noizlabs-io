import { Rocket } from 'lucide-react';

const Staking = () => {
  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold text-gradient">Coming Soon</h1>
          <p className="text-xl text-muted-foreground">
            Staking features are currently under development
          </p>
        </div>
      </div>
    </div>
  );
};

export default Staking;
