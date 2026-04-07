import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, CheckCircle2, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletDisplayProps {
  totalEarnings: number;
  totalTasks: number;
  averageRating: number;
}

export default function WalletDisplay({ totalEarnings, totalTasks, averageRating }: WalletDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">My Wallet</CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Active
          </Badge>
        </div>
        <CardDescription>Your earnings and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Earnings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Total Earnings</span>
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">₹{totalEarnings.toFixed(2)}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tasks Completed */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground font-medium">Tasks Done</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-medium">Avg Rating</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
              <span className="text-warning text-lg">⭐</span>
            </div>
          </div>
        </div>

        {/* Withdraw Button (Placeholder) */}
        <Button 
          variant="outline" 
          className="w-full border-primary/30 hover:bg-primary/10"
          disabled
        >
          <Wallet className="h-4 w-4 mr-2" />
          Withdraw Earnings (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
