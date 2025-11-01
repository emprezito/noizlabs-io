import { SwapWidget } from '@/components/SwapWidget';

const Swap = () => {
  return (
    <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <SwapWidget />
        </div>
      </div>
    </div>
  );
};

export default Swap;
