import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PhoneNumberDisplayProps {
  name: string;
  phone: string;
  role: 'bondhu' | 'poster';
}

export default function PhoneNumberDisplay({ name, phone, role }: PhoneNumberDisplayProps) {
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:${phone}`;
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {role === 'bondhu' ? 'Bondhu Helper' : 'Task Poster'}
              </Badge>
            </div>
            <p className="font-semibold text-foreground truncate">{name}</p>
            <p className="text-sm text-muted-foreground font-mono">{phone}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleCall}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMessage}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              SMS
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
