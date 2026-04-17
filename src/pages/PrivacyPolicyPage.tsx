import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/common/Logo';
import CampusBackground from '@/components/common/CampusBackground';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <CampusBackground />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-primary/20 p-6 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-center text-muted-foreground mb-10 text-sm">
            Last Updated: April 17, 2026
          </p>

          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            At BondhuApp, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">1</span>
                Information We Collect
              </h2>
              <div className="pl-10 space-y-3">
                <p className="text-muted-foreground">We may collect the following information:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                  <li><strong>Personal Information:</strong> Name, Email Address, Phone Number</li>
                  <li><strong>Profile Details:</strong> Profile photo (optional)</li>
                  <li><strong>Payment Information:</strong> UPI ID / Bank Account Details (for withdrawals)</li>
                  <li><strong>Task Data:</strong> Information related to tasks you post or accept</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">2</span>
                How We Use Your Information
              </h2>
              <div className="pl-10 space-y-3">
                <p className="text-muted-foreground">We use your data to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                  <li>Create and manage your account</li>
                  <li>Connect Task Posters with Bondhu Helpers</li>
                  <li>Process payments and withdrawals</li>
                  <li>Improve user experience and platform features</li>
                  <li>Communicate important updates and notifications</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">3</span>
                Data Sharing and Disclosure
              </h2>
              <div className="pl-10 space-y-3">
                <p className="text-muted-foreground font-medium">We do not sell your personal data.</p>
                <p className="text-muted-foreground">We may share limited data with:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                  <li>Payment partners (for transactions)</li>
                  <li>Service providers (for app functionality)</li>
                </ul>
                <p className="text-muted-foreground">Data is shared only when necessary.</p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">4</span>
                Data Security
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>We use industry-standard security measures</li>
                <li>Sensitive data is protected using encryption (SSL/TLS)</li>
                <li>Payment data is securely handled by trusted partners</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">5</span>
                Privacy & Confidentiality
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>Users must not share personal/private information unnecessarily</li>
                <li>All communication should remain task-related only</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">6</span>
                Your Rights
              </h2>
              <div className="pl-10 space-y-3">
                <p className="text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                  <li>Access your data</li>
                  <li>Update or correct your information</li>
                  <li>Request account deletion</li>
                </ul>
                <p className="text-muted-foreground">To exercise these rights, contact us via email.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">7</span>
                Changes to Policy
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>We may update this Privacy Policy from time to time</li>
                <li>Changes will be reflected with an updated date</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">8</span>
                Contact Us
              </h2>
              <div className="pl-10">
                <p className="text-muted-foreground mb-2">For privacy-related concerns, contact:</p>
                <a
                  href="mailto:bondhuappnow@gmail.com"
                  className="inline-flex items-center gap-2 text-secondary hover:underline font-medium"
                >
                  📧 bondhuappnow@gmail.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
