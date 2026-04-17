import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface CoinsSectionProps {
  coins: number;
}

export default function CoinsSection({ coins }: CoinsSectionProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-5xl">🪙</span>
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <div className="bg-[#FFD700] h-2 w-2 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bondhu Coins</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">{coins}</span>
                <span className="text-sm font-medium text-[#B8860B]">Coins Available</span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end gap-2 text-right">
            <div className="flex items-center gap-2 text-xs font-medium text-[#B8860B] bg-white/50 px-3 py-1.5 rounded-full border border-[#FFD700]/20">
              <Info className="h-3.5 w-3.5" />
              <span>1 Task = 1 Coin 🪙</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium max-w-[150px]">
              Use coins for special features and premium badges coming soon!
            </p>
          </div>
        </div>
        
        {/* Progress visual bar */}
        <div className="h-1.5 w-full bg-gray-100/50">
          <div 
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]" 
            style={{ width: `${Math.min((coins % 10) * 10, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
