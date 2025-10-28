import { Button } from '@/components/ui/button';
import { TopFiveTokens } from './TopFiveTokens';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-32 lg:pb-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">
            Top 5 Meme Sounds This Week – Now Tokenized 🎧💥
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Every week, the loudest memes are crowned – and their sounds are turned into tradable tokens. Discover them below.
          </p>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => navigate('/arena')}
            className="mt-4"
          >
            View Leaderboard
          </Button>
        </div>

        {/* Top 5 Token Cards */}
        <TopFiveTokens />
      </div>
    </div>
  );
};

export default Marketplace;
