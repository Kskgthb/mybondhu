import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, HandHeart, Star, MapPin, Clock, Shield, Youtube, Instagram, Linkedin, Mail, MessageCircle, Search, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import CategoryMapExplorer from '@/components/common/CategoryMapExplorer';
import Logo from '@/components/common/Logo';
import CategoryCard from '@/components/common/CategoryCard';
import { categoryData } from '@/lib/categoryData';
import Footer from '@/components/common/Footer';
import CategoryExplorer from '@/components/common/CategoryExplorer';
import { HomeBannerCarousel } from '@/components/common/HomeBannerCarousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is BondhuApp & how does it work?",
    answer: "BondhuApp is a task-sharing platform connecting people who need help with 'Bondhus' who can assist. A user posts a task, a Bondhu accepts it, and gets paid plus rewards upon completion."
  },
  {
    question: "Who can join and what tasks are allowed?",
    answer: "Anyone can join! You can post or accept genuine tasks like assignment help, errands, or notes sharing. Fake, harmful, or time-pass tasks are strictly prohibited."
  },
  {
    question: "How do I earn money as a Bondhu?",
    answer: "By accepting and successfully completing tasks. Earnings are credited directly after verification. You work with full flexibility—accept tasks anytime that suits your schedule."
  },
  {
    question: "What are Bondhu Coins and the Referral System?",
    answer: "Bondhu Coins are digital rewards (1 coin per task). You also earn 5 coins for every friend you refer who registers and posts their first task."
  },
  {
    question: "How can I withdraw my earnings?",
    answer: "Add your UPI ID in the wallet section and request a withdrawal. Your amount is securely credited within 24–48 hours (a 15% platform fee applies)."
  },
  {
    question: "Is my personal information and payment safe?",
    answer: "Absolutely. BondhuApp uses secure systems to protect your data. If anyone misbehaves, strict actions including permanent bans are taken to keep the community safe."
  },
  {
    question: "What if a task isn't done properly?",
    answer: "You can report issues and provide a rating/feedback. Our support team reviews all cases to ensure a safe experience. Contact us anytime at support@bondhuapp.com."
  }
];

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

        {/* Category Explorer Tabs */}
        <CategoryExplorer />

        {/* Interactive Map Explorer */}
        <CategoryMapExplorer />

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

        {/* Need an Instant Bondhu Section */}
        <div className="max-w-6xl mx-auto mb-16 mt-12">
          <Card className="shadow-2xl hover:shadow-hover transition-all duration-300 border-none bg-white rounded-[40px] overflow-hidden border-2 border-slate-100 p-4 sm:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="w-full md:w-1/2 p-4 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                    <UserCheck className="h-10 w-10 text-primary" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-800 mb-4 leading-tight">Need an Instant <span className="text-primary">Bondhu</span></h3>
                <p className="text-lg font-bold text-slate-600 mb-8">
                  Post your task and get help from nearby trusted helpers
                </p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-4 text-slate-700 font-bold">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary"><Clock className="h-6 w-6" strokeWidth={2.5} /></div>
                    <span>Get instant help for urgent tasks</span>
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary"><MapPin className="h-6 w-6" strokeWidth={2.5} /></div>
                    <span>Find helpers near your location</span>
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary"><Star className="h-6 w-6" strokeWidth={2.5} /></div>
                    <span>Rate and review your experience</span>
                  </li>
                </ul>
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-xl" 
                  size="lg"
                  onClick={() => navigate('/signup')}
                >
                  Post a Task
                </Button>
              </div>
              <div className="w-full md:w-1/2 relative">
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
                  <img 
                    src="/need_bondhu_hero.jpg" 
                    alt="Students needing help" 
                    className="w-full h-full object-cover aspect-video sm:aspect-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Join as Bondhu Section - Redesigned to EnglishYaari Style */}
        <div className="max-w-6xl mx-auto mb-16 mt-12">
          <Card className="shadow-2xl border-none bg-white rounded-[40px] overflow-hidden border-2 border-slate-100 p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Left Side: Hero Image */}
              <div className="w-full lg:w-1/2 relative">
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
                  <img 
                    src="/become_bondhu_hero.jpg" 
                    alt="Happy student helpers" 
                    className="w-full h-full object-cover aspect-video sm:aspect-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
                
                {/* Floating Stats Badge */}
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 animate-bounce-slow">
                   <p className="text-sm font-black text-slate-800">Joined by 500+ Students</p>
                   <div className="flex -space-x-2 mt-2">
                      <img src="/face1.jpg" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="Student" />
                      <img src="/face2.jpg" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="Student" />
                      <img src="/face3.jpg" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="Student" />
                      <img src="/face4.jpg" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="Student" />
                   </div>
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 leading-tight">
                  Become a <span className="text-secondary">Bondhu</span> with BondhuApp
                </h2>
                <p className="text-lg font-bold text-slate-600 mb-10 tracking-tight">
                  Help others on campus and earn on your own schedule
                </p>

                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                      <Clock className="h-6 w-6" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-800 leading-tight">Flexible working hours</h4>
                      <p className="text-sm font-bold text-slate-500">Work whenever you have free time</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                      <Shield className="h-6 w-6" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-800 leading-tight">Build your reputation</h4>
                      <p className="text-sm font-bold text-slate-500">Get verified and earn top ratings</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                      <HandHeart className="h-6 w-6" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-800 leading-tight">Community Support</h4>
                      <p className="text-sm font-bold text-slate-500">Join a network of helpful students</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/register/bondhu')}
                  className="w-full sm:w-auto px-12 h-16 rounded-[24px] text-xl font-black bg-secondary hover:bg-secondary/90 shadow-[0_15px_30px_-10px_rgba(47,190,107,0.4)] transition-all hover:scale-105 group"
                >
                  Become a Bondhu
                  <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mb-16 mt-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4 leading-tight">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg font-bold text-slate-600">
              Simple steps to get started with BondhuApp
            </p>
          </div>

          <Card className="shadow-2xl hover:shadow-hover transition-all duration-300 border-none bg-white rounded-[40px] overflow-hidden border-2 border-slate-100 p-4 sm:p-10 relative">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: Image / Visual */}
              <div className="w-full lg:w-1/2 flex justify-center relative">
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-slate-50 bg-slate-50 w-full">
                  <img 
                    src="/task-flow.jpg" 
                    alt="Task Flow - From posting to completion" 
                    className="w-full h-auto object-cover aspect-square sm:aspect-auto sm:min-h-[400px]"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right: Steps */}
              <div className="w-full lg:w-1/2 space-y-8">
                {/* Step 1 */}
                <div className="flex gap-6 items-start group">
                  <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-sm flex-shrink-0 border-2 border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <span className="text-2xl font-black">1</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">Post Your Task</h3>
                    <p className="text-base font-bold text-slate-500">
                      Describe what you need help with and set your preferred amount to get started instantly.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-6 items-start group">
                  <div className="w-16 h-16 rounded-[24px] bg-secondary/10 flex items-center justify-center text-secondary shadow-sm flex-shrink-0 border-2 border-secondary/20 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                    <span className="text-2xl font-black">2</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">Get Matched</h3>
                    <p className="text-base font-bold text-slate-500">
                      Nearby trusted Bondhus receive your request and accept the task in real-time.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-6 items-start group">
                  <div className="w-16 h-16 rounded-[24px] bg-accent/10 flex items-center justify-center text-accent shadow-sm flex-shrink-0 border-2 border-accent/20 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <span className="text-2xl font-black">3</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">Task Complete</h3>
                    <p className="text-base font-bold text-slate-500">
                      Track progress, seamlessly complete your payment, and rate your overall experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-16 mt-16 px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-8 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white border border-slate-100 shadow-sm rounded-lg overflow-hidden px-6 transition-all hover:border-slate-200"
                >
                  <AccordionTrigger className="text-left font-semibold text-slate-800 py-5 hover:no-underline text-base sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-5 leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">Already have an account?</p>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
