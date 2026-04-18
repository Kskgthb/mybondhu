import { ReactNode } from 'react';
import Header from '@/components/common/Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen relative isolate">
      {/* Subtle Full-screen Background Pattern (Watermark style) */}
      <div 
        className="fixed inset-0 -z-10 opacity-[0.05] pointer-events-none"
        style={{ 
          backgroundImage: "url('/images/bg-pattern.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: '800px auto',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed'
        }}
        aria-hidden="true"
      />
      <Header />
      
      {/* We use flex-1 to take up remaining height, but Header is sticky so it doesn't take height in flex context necessarily. Wait, Header has sticky top-0, but it is IN the document flow, so it takes up space. */}
      <div className="flex flex-1 relative">
        {/* Sidebar for Desktop */}
        <div className="hidden md:flex w-64 flex-shrink-0 z-30">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        {/* On mobile, we add pb-20 to ensure content isn't hidden behind the BottomNav */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden pb-20 md:pb-0">
          {children}
        </main>
        
        {/* Bottom Navigation for Mobile */}
        <BottomNav />
      </div>
    </div>
  );
}
