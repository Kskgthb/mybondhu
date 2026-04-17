import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-50 to-slate-100 border-t-2 border-primary/10 mt-8">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo size="md" />
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs mt-1">
              India's first campus-level peer-to-peer task helper platform. Get help or become a Bondhu today!
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm font-medium"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm font-medium"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-foreground mb-4">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:bondhuappnow@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm font-medium"
                >
                  📧 bondhuappnow@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/bondhuapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-pink-600 transition-colors duration-200 text-sm font-medium"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/bondhuapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com/@bondhuapp?si=ZY8F3mB1e-J9lTP_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-red-600 transition-colors duration-200 text-sm font-medium"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-primary/10 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} <span style={{ color: '#641acc', fontWeight: 600 }}>Bondhu</span><span style={{ color: '#2fbe6b', fontWeight: 600 }}>App</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
