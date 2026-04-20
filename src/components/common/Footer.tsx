import { Link, useNavigate } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Linkedin, Youtube, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="w-full mt-12" style={{ backgroundColor: '#641acc', color: 'white' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Top CTA Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-8 border-b border-white/20 gap-6">
          <div className="flex items-center gap-2">
            {/* Map Pin Logo */}
            <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
            <span className="text-3xl font-extrabold tracking-tight text-white">BondhuApp</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <span className="text-xl font-medium text-white/90 text-center sm:text-left">
              Want to get help or earn money? Post a task!
            </span>
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-3 rounded-full font-bold text-white transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#2fbe6b' }}
            >
              Get started
            </button>
          </div>
        </div>

        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* About Column */}
          <div className="space-y-6">
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              BondhuApp is a dynamic campus platform that offers a unique blend of peer-to-peer task assistance and community building.
            </p>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white text-lg">#BondhuApp</span>
              <span className="text-white/80 text-sm">Crafted with <span className="text-red-500">❤️</span> in Kolkata</span>
            </div>
          </div>

          {/* Connect us Column */}
          <div>
            <h3 className="text-lg font-bold mb-5" style={{ color: '#2fbe6b' }}>Connect us</h3>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-white mb-1">Email</p>
                <a href="mailto:bondhuappnow@gmail.com" className="text-white/80 hover:text-white transition-colors text-sm">
                  bondhuappnow@gmail.com
                </a>
              </div>
              <div>
                <p className="font-bold text-white mb-1 flex items-center gap-1">
                  Our Locations <MapPin className="w-4 h-4" />
                </p>
                <p className="text-white/80 text-sm leading-relaxed mb-2">
                  <span className="font-semibold text-white">Corporate Office :</span> Salt Lake, Kolkata, West Bengal
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  <span className="font-semibold text-white">Registered Office :</span> Salt Lake, Kolkata, West Bengal
                </p>
              </div>
            </div>
          </div>

          {/* Useful links Column */}
          <div>
            <h3 className="text-lg font-bold mb-5" style={{ color: '#2fbe6b' }}>Useful links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">About Us</Link>
              </li>
              <li>
                <Link to="/register/bondhu" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Become a Bondhu</Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Download App Column */}
          <div>
            <h3 className="text-lg font-bold mb-5" style={{ color: '#2fbe6b' }}>Download the App</h3>
            <div className="space-y-4">
              {/* Google Play Button Placeholder */}
              <button className="flex items-center gap-3 bg-transparent border border-white/40 hover:bg-white/10 transition-colors rounded-lg px-4 py-2 w-48">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M3 20.5v-17c0-.5.3-.9.7-1l12.7 8.5-12.7 8.5c-.4-.1-.7-.5-.7-1z" opacity=".2"/>
                   <path d="M4 2v20l14.5-10L4 2zm1 1.7L16.2 12 5 18.3V3.7z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/80 uppercase tracking-wide">Get it on</div>
                  <div className="text-sm font-bold text-white">Google Play</div>
                </div>
              </button>

              {/* App Store Button Placeholder */}
              <button className="flex items-center gap-3 bg-transparent border border-white/40 hover:bg-white/10 transition-colors rounded-lg px-4 py-2 w-48">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.6 14.4c-.1-3 2.5-4.4 2.6-4.5-1.4-2-3.6-2.3-4.4-2.3-1.8-.2-3.6 1.1-4.6 1.1-1 0-2.4-1-3.9-1-2 0-3.8 1.1-4.8 2.9-2.1 3.6-.5 8.9 1.5 11.7 1 1.4 2.1 2.9 3.6 2.8 1.4-.1 2-1 3.7-1 1.7 0 2.2 1 3.7 1 1.5.1 2.5-1.3 3.5-2.7 1.1-1.6 1.6-3.2 1.6-3.2-.1-.1-2.5-1-2.5-3.8zM14 4.5c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.7-3.3 1.7-.7.8-1.3 2.1-1.1 3.4 1.3.1 2.5-.7 3.3-1.6z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/80 uppercase tracking-wide">Download on the</div>
                  <div className="text-sm font-bold text-white">App Store</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between pt-8 border-t border-white/20 gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-white/80 text-center sm:text-left">
            <div className="flex gap-4">
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <span>|</span>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
            <span className="hidden sm:inline">|</span>
            <span>© Copyright {currentYear} BONDHUAPP PRIVATE LIMITED | All Rights Reserved.</span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-5">
            <a href="https://chat.whatsapp.com/EDOwN8UcN3NGfBQW3v1lf0?mode=gi_t" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#2fbe6b] transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/bondhuapp" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#2fbe6b] transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/@bondhuapp?si=ZY8F3mB1e-J9lTP_" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#2fbe6b] transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="#" className="text-white hover:text-[#2fbe6b] transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-white hover:text-[#2fbe6b] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/bondhuapp" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#2fbe6b] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
