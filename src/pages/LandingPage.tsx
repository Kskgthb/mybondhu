import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, HandHeart, Star, MapPin, Clock, Shield, Youtube, Instagram, Linkedin, Mail, MessageCircle, Search } from 'lucide-react';
import { useEffect } from 'react';
import CategoryExplorer from '@/components/common/CategoryExplorer';
import Logo from '@/components/common/Logo';
import CategoryCard from '@/components/common/CategoryCard';
import { categoryData } from '@/lib/categoryData';
import Footer from '@/components/common/Footer';
import { HomeBannerCarousel } from '@/components/common/HomeBannerCarousel';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      // Use active_role if available, otherwise fall back to role
      const activeRole = profile.active_role || profile.role;
      
      if (activeRole === 'need_bondhu') {
        navigate('/need-bondhu/dashboard');
      } else if (activeRole === 'bondhu') {
        navigate('/bondhu/dashboard');
      } else if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [user, profile, navigate]);

  return (
    <div className="min-h-screen relative">

      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Search Section */}
        <div className="text-center mb-16 mt-8 md:mt-16 animate-fade-in relative z-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-10 tracking-tight" style={{ color: '#6411ac' }}>
            <span style={{ color: '#6411ac' }}>Post</span> Your <span style={{ color: '#2fbe6b' }}>First</span> Task!!
          </h1>
          
          <div className="max-w-4xl mx-auto px-4 relative">
            <div className="relative flex items-center bg-white rounded-full shadow-lg border border-slate-200 overflow-hidden h-14 md:h-16 transition-all hover:shadow-xl hover:border-primary/30">
              <div className="flex-1 flex items-center pl-6 md:pl-8 h-full border-r border-slate-100">
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  className="w-full bg-transparent border-none outline-none text-base md:text-lg text-slate-700 placeholder:text-slate-400 h-full"
                  onClick={() => navigate('/signup')}
                />
              </div>
              <div className="hidden sm:flex items-center px-4 w-40 md:w-56 h-full bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <select 
                  className="w-full bg-transparent border-none outline-none text-sm md:text-base text-slate-600 cursor-pointer h-full"
                  onChange={(e) => {
                    if (e.target.value) navigate('/signup');
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>All Domains</option>
                  {categoryData.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => navigate('/signup')}
                className="hover:opacity-90 h-full px-6 md:px-10 flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#2fbe6b' }}
                aria-label="Search"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#f1f5f9' }} />
              </button>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-sm font-medium text-slate-500 mr-2">Popular:</span>
              {categoryData.slice(0, 4).map((category) => (
                <button
                  key={category.value}
                  onClick={() => navigate('/signup')}
                  className="text-sm px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Home Banners */}
        <div className="mb-12">
          <HomeBannerCarousel />
        </div>

        {/* Dynamic Category Explorer - Replaces Carousel */}
        <CategoryExplorer />

        {/* Categories Section */}
        <div className="max-w-7xl mx-auto mb-16 mt-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#2fbe6b' }}>
              Explore Our Services
            </h2>
            <p className="text-muted-foreground text-xl font-medium">
              Find the perfect helper for any task on campus
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-8">
            {categoryData.map((category) => (
              <CategoryCard
                key={category.value}
                category={category}
                onClick={() => navigate('/signup')}
              />
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 mt-12">
          <Card className="shadow-2xl hover:shadow-hover transition-all duration-300 border-3 border-primary/30 hover:border-primary/60 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                  <UserCheck className="h-10 w-10 text-primary" strokeWidth={2.5} />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Need an Instant Bondhu</CardTitle>
              <CardDescription className="text-base font-medium">
                Post your task and get help from nearby trusted helpers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Get instant help for urgent tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Find helpers near your location</span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Rate and review your experience</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={() => navigate('/signup')}
              >
                Post a Task
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl hover:shadow-hover transition-all duration-300 border-3 border-secondary/30 hover:border-secondary/60 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center shadow-lg">
                  <HandHeart className="h-10 w-10 text-secondary" strokeWidth={2.5} />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Join as Bondhu</CardTitle>
              <CardDescription className="text-base font-medium">
                Help others and earn money by completing tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-secondary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Build your reputation with ratings</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-secondary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Accept tasks in your area</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-secondary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-medium">Work on your own schedule</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-secondary hover:bg-secondary/90" 
                size="lg"
                onClick={() => navigate('/register/bondhu')}
              >
                Become a Helper
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="shadow-card border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-background">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">How It Works</CardTitle>
              <CardDescription className="text-base">
                Simple steps to get started with Bondhu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-accent/20 bg-white max-w-md">
                  <img 
                    src="/task-flow.jpg" 
                    alt="Task Flow - From posting to completion" 
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <div className="grid xl:grid-cols-3 gap-6 mt-8">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold text-lg">Post Your Task</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe what you need help with and set your preferred amount
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="font-semibold text-lg">Get Matched</h3>
                  <p className="text-sm text-muted-foreground">
                    Nearby Bondhus receive notifications and can accept your task
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-accent">3</span>
                  </div>
                  <h3 className="font-semibold text-lg">Task Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Track progress, complete payment, and rate your experience
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">Already have an account?</p>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>

        {/* Love BondhuApp Section */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
          <Card className="shadow-card border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl mb-2 flex items-center justify-center gap-2">
                <HandHeart className="h-8 w-8 text-primary" />
                Love BondhuApp?
              </CardTitle>
              <CardDescription className="text-base">
                Follow us on social media and stay connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center gap-6 flex-wrap">
                {/* YouTube */}
                <a
                  href="https://youtube.com/@bondhuapp?si=ZY8F3mB1e-J9lTP_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
                  aria-label="Visit our YouTube channel"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <Youtube className="h-8 w-8 text-red-600 dark:text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-500">
                    YouTube
                  </span>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/bondhuapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all duration-300"
                  aria-label="Follow us on Instagram"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <Instagram className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-500">
                    Instagram
                  </span>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/bondhuapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300"
                  aria-label="Connect with us on LinkedIn"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <Linkedin className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-500">
                    LinkedIn
                  </span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Us Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="shadow-card border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-background">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl mb-2 flex items-center justify-center gap-2">
                <Mail className="h-8 w-8 text-secondary" />
                Contact Us
              </CardTitle>
              <CardDescription className="text-base">
                Have questions? We'd love to hear from you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <a
                  href="mailto:bondhuappnow@gmail.com"
                  className="group flex items-center gap-4 p-6 rounded-xl hover:bg-secondary/10 transition-all duration-300 border-2 border-secondary/20 hover:border-secondary/40"
                  aria-label="Send us an email"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Mail className="h-7 w-7 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email us at</p>
                    <p className="text-lg font-semibold text-secondary group-hover:underline">
                      bondhuappnow@gmail.com
                    </p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join BondhuCommunity Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="shadow-card border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-background">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl mb-2 flex items-center justify-center gap-2">
                <MessageCircle className="h-8 w-8 text-accent" />
                Join BondhuCommunity
              </CardTitle>
              <CardDescription className="text-base">
                Connect with other users, share experiences, and get support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <a
                  href="https://chat.whatsapp.com/EDOwN8UcN3NGfBQW3v1lf0?mode=gi_t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-6 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-300 border-2 border-green-500/20 hover:border-green-500/40"
                  aria-label="Join our WhatsApp community"
                >
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <MessageCircle className="h-7 w-7 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Join our community on</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-500 group-hover:underline flex items-center gap-2">
                      WhatsApp Community
                      <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                        Free
                      </span>
                    </p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
