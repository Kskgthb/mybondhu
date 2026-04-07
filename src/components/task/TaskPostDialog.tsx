import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi } from '@/db/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MapPin, X } from 'lucide-react';
import type { TaskUrgency } from '@/types/types';
import { categories } from '@/lib/categories';
import { reverseGeocode } from '@/lib/googleMaps';
import { generateUPIQRData } from '@/services/paymentService';

interface TaskPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TaskPostDialog({ open, onOpenChange, onSuccess }: TaskPostDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationFromGPS, setLocationFromGPS] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location_address: '',
    location_lat: 0,
    location_lng: 0,
    urgency: 'medium' as TaskUrgency,
    amount: '',
    payment_method: 'online' as 'cash' | 'online', // Only online payment allowed
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to post a task');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.location_address.trim()) {
      toast.error('Please enter a location');
      return;
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Generate UPI QR data for online payments
      const amount = Number.parseFloat(formData.amount);
      const paymentQRData = formData.payment_method === 'online' 
        ? generateUPIQRData(
            amount,
            'bondhuapp@upi', // Default UPI ID - can be configured
            'Bondhu App',
            `Payment for: ${formData.title}`
          )
        : null;

      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location_address: formData.location_address,
        location_lat: formData.location_lat || 0,
        location_lng: formData.location_lng || 0,
        urgency: formData.urgency,
        amount: amount,
        poster_id: user.id,
        payment_method: formData.payment_method,
        payment_qr_data: paymentQRData || null,
        code_verified: false,
        code_verified_at: null,
        payment_verified: false,
        payment_verified_at: null,
        completion_step: 'pending' as const,
      };

      console.log('📝 Creating task with data:', taskData);

      const result = await tasksApi.createTask(taskData);

      console.log('✅ Task created successfully:', result);

      toast.success('Task posted successfully!');

      setFormData({
        title: '',
        description: '',
        category: '',
        location_address: '',
        location_lat: 0,
        location_lng: 0,
        urgency: 'medium',
        amount: '',
        payment_method: 'online', // Only online payment
      });
      setLocationFromGPS(false);

      onSuccess();
    } catch (error: any) {
      console.error('❌ Error posting task:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to post task';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.code === '23514') {
        errorMessage = 'Invalid data: Please check all fields are filled correctly';
      }
      if (error.code === '23503') {
        errorMessage = 'User profile not found. Please try logging in again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    toast.info('📍 Getting your current location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          // Reverse geocode to get real address
          toast.info('🔍 Finding your address...');
          const address = await reverseGeocode(latitude, longitude);

          setFormData(prev => ({
            ...prev,
            location_address: address,
            location_lat: latitude,
            location_lng: longitude,
          }));
          setLocationFromGPS(true);
          setFetchingLocation(false);
          toast.success('✅ Location captured successfully!');
        } catch (error: any) {
          console.error('Reverse geocoding error:', error);
          setFetchingLocation(false);
          
          // Store coordinates even if address lookup fails
          setFormData(prev => ({
            ...prev,
            location_lat: latitude,
            location_lng: longitude,
          }));
          
          // Show user-friendly error message
          toast.error(error.message || 'Unable to get address automatically. Please enter your address manually.');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setFetchingLocation(false);
        
        let errorMessage = 'Failed to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable. Please try again.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const clearLocation = () => {
    setFormData(prev => ({
      ...prev,
      location_address: '',
      location_lat: 0,
      location_lng: 0,
    }));
    setLocationFromGPS(false);
    toast.info('Location cleared. You can enter manually or use GPS again.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to post your task and find a Bondhu helper
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Help me move furniture"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what you need help with..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="grid xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency *</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value as TaskUrgency })}
                disabled={loading}
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location Address *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="location"
                  placeholder={locationFromGPS ? "GPS location captured" : "Click 'Use Current Location' to get GPS address"}
                  value={formData.location_address}
                  onChange={(e) => {
                    setFormData({ ...formData, location_address: e.target.value });
                    setLocationFromGPS(false); // Mark as manual entry
                  }}
                  disabled={loading || fetchingLocation}
                  className={locationFromGPS ? "pr-10" : ""}
                />
                {locationFromGPS && (
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant={locationFromGPS ? "secondary" : "default"}
                onClick={getCurrentLocation}
                disabled={loading || fetchingLocation}
                className="flex-shrink-0"
              >
                {fetchingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Use Current
                  </>
                )}
              </Button>
            </div>
            {locationFromGPS && (
              <div className="flex items-center gap-2 text-xs text-success">
                <MapPin className="h-3 w-3" />
                <span>Real GPS location verified ✓</span>
              </div>
            )}
            {!locationFromGPS && formData.location_address && (
              <p className="text-xs text-warning">
                ⚠️ Manual address entry - Please use GPS for accurate location
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Click "Use Current Location" to automatically get your real GPS address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="0"
              placeholder="e.g., 500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Mode *</Label>
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
              <span className="text-sm font-medium text-primary">💳 Online Payment Only</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All payments are processed online via UPI for security and transparency
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
