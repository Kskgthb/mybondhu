import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Users, Gift, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralSectionProps {
  referralCode: string | null;
}

export default function ReferralSection({ referralCode }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/signup?ref=${referralCode || ''}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BondhuApp!',
          text: `Use my referral code ${referralCode} to join BondhuApp and get help from campus friends!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold">Refer & Earn 🪙</CardTitle>
        <CardDescription className="max-w-xs mx-auto text-gray-600">
          Invite friends to BondhuApp and earn <span className="font-bold text-primary">5 Bondhu Coins</span> when they post their first task!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pb-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
             <div className="relative flex-grow">
               <Input 
                 readOnly 
                 value={shareUrl} 
                 className="pr-12 bg-white border-primary/20 h-11 text-sm text-gray-500 font-medium"
               />
               <Button 
                 size="sm" 
                 variant="ghost" 
                 className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-primary/5 text-primary"
                 onClick={copyToClipboard}
               >
                 {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
               </Button>
             </div>
             <Button className="h-11 px-4 gap-2 shadow-sm" onClick={handleShare}>
               <Share2 className="h-4 w-4" />
               <span className="hidden sm:inline">Share</span>
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-primary/10">
          <div className="flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-2 mb-2 shadow-sm">
              <Users className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Step 1</p>
            <p className="text-xs font-semibold text-gray-700">Invite a friend</p>
          </div>
          
          <div className="hidden sm:flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-primary/30" />
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-2 mb-2 shadow-sm">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Step 2</p>
            <p className="text-xs font-semibold text-gray-700">They post first task</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
