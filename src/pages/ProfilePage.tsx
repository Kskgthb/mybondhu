import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Calendar, Award, Building2, FileText, CheckCircle2, Clock, XCircle, Image as ImageIcon, IdCard, CreditCard, ExternalLink, Wallet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EXPERTISE_DOMAINS } from '@/constants/expertise';

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  const getVerificationBadge = () => {
    if (profile.role !== 'bondhu') return null;

    const statusConfig = {
      pending: { icon: Clock, label: 'Pending Verification', variant: 'secondary' as const },
      verified: { icon: CheckCircle2, label: 'Verified', variant: 'default' as const },
      rejected: { icon: XCircle, label: 'Verification Rejected', variant: 'destructive' as const }
    };

    const config = statusConfig[profile.verification_status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photo_url || profile.avatar_url || undefined} alt={profile.full_name || profile.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {profile.full_name || profile.username}
                </CardTitle>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {profile.role.replace('_', ' ')}
                  </Badge>
                  {profile.role === 'bondhu' && profile.availability_status && (
                    <Badge variant="default" className="bg-success">
                      Available
                    </Badge>
                  )}
                  {getVerificationBadge()}
                </div>
                {profile.email && (
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                )}
                {(profile.phone || profile.contact_no) && (
                  <p className="text-sm text-muted-foreground">{profile.phone || profile.contact_no}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {profile.role === 'bondhu' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Helper Statistics</CardTitle>
                <CardDescription>Your performance as a Bondhu helper</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid xl:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-accent/20">
                      <Star className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.rating_avg.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.total_tasks}</p>
                      <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-secondary/20">
                      <Calendar className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatDistanceToNow(new Date(profile.created_at), { addSuffix: false })}
                      </p>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 via-background to-primary/10 border-secondary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-secondary/20">
                    <Wallet className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle>Wallet</CardTitle>
                    <CardDescription>Your total earnings from completed tasks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-secondary">₹{profile.total_earnings?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks Completed</p>
                      <p className="text-xl font-semibold">{profile.total_tasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. per Task</p>
                      <p className="text-xl font-semibold">
                        ₹{profile.total_tasks > 0 ? ((profile.total_earnings || 0) / profile.total_tasks).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {profile.role === 'bondhu' && (profile.college_name || profile.about || (profile.expertise && profile.expertise.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle>Bondhu Details</CardTitle>
              <CardDescription>Your profile information and expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.college_name && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{profile.college_name}</p>
                    {profile.campus_location && (
                      <p className="text-xs text-muted-foreground">{profile.campus_location}</p>
                    )}
                  </div>
                </div>
              )}

              {profile.about && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-sm text-muted-foreground">{profile.about}</p>
                  </div>
                </div>
              )}

              {profile.expertise && profile.expertise.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    Expertise Domains
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {profile.expertise.map((expertiseId) => {
                      const domain = EXPERTISE_DOMAINS.find(d => d.id === expertiseId);
                      if (!domain) return null;
                      const Icon = domain.icon;
                      return (
                        <div
                          key={expertiseId}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium">{domain.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {profile.role === 'bondhu' && (profile.photo_url || profile.college_id_url || profile.aadhaar_url) && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Your uploaded documents for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.photo_url && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile Photo</p>
                      <p className="text-xs text-muted-foreground">Your profile picture</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(profile.photo_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              )}

              {profile.college_id_url && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary/10">
                      <IdCard className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">College ID</p>
                      <p className="text-xs text-muted-foreground">Student identification card</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(profile.college_id_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              )}

              {profile.aadhaar_url && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-accent/10">
                      <CreditCard className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aadhaar Card</p>
                      <p className="text-xs text-muted-foreground">Government ID proof</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(profile.aadhaar_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Verification Status</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.verification_status === 'pending' && 'Your documents are under review'}
                      {profile.verification_status === 'verified' && 'Your documents have been verified'}
                      {profile.verification_status === 'rejected' && 'Your documents were rejected. Please contact support.'}
                    </p>
                  </div>
                  {getVerificationBadge()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profile.location_lat && profile.location_lng && (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Your current location settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Lat: {profile.location_lat.toFixed(6)}, Lng: {profile.location_lng.toFixed(6)}
                  </p>
                  {profile.location_updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(profile.location_updated_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">
                {formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
