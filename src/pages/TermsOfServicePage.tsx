import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/common/Logo';
import CampusBackground from '@/components/common/CampusBackground';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-center text-muted-foreground mb-10 text-sm">
            Last Updated: April 17, 2026
          </p>

          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            Please read these terms carefully before using BondhuApp.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</span>
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed pl-10">
                By creating an account and using BondhuApp, you agree to these Terms of Service. If you do not agree, please do not use the platform.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</span>
                Platform Overview
              </h2>
              <div className="pl-10">
                <p className="text-muted-foreground leading-relaxed mb-3">BondhuApp provides two roles:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                  <li><strong>Task Poster (Need Bondhu)</strong> – Post tasks or requests</li>
                  <li><strong>Bondhu Helper (Become Bondhu)</strong> – Help others and earn rewards</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">3</span>
                Eligibility
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>No prerequisites to join</li>
                <li>Users must have a genuine intention to help or seek help</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">4</span>
                User Conduct
              </h2>
              <div className="pl-10 space-y-3">
                <div>
                  <p className="text-muted-foreground font-medium mb-1.5">Users must:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Be respectful, polite, and professional</li>
                    <li>Avoid fake, unethical, or time-pass tasks</li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1.5">Strictly prohibited:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Fraud, misuse, or harmful activity</li>
                    <li>Harassment or misbehavior (especially gender-based)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1.5">Violation may result in:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Account suspension</li>
                    <li>Permanent ban</li>
                    <li>Legal action</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">5</span>
                Task Policy
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>Only genuine and ethical tasks are allowed</li>
                <li>BondhuApp does not guarantee 100% task completion</li>
                <li>Task success depends on availability and complexity</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">6</span>
                Responsibilities of Helpers
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>Accept tasks only if capable</li>
                <li>Once accepted, make a sincere effort to complete</li>
                <li>Maintain professionalism</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">7</span>
                Earnings & Payments
              </h2>
              <div className="pl-10 space-y-3">
                <div>
                  <p className="text-muted-foreground font-medium mb-1.5">Users earn:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Money 💰</li>
                    <li>Bondhu Coins 🪙</li>
                  </ul>
                </div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Payments are processed within 24–48 hours after verification</li>
                  <li>15% platform fee applies</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">8</span>
                Referral Program
              </h2>
              <div className="pl-10 space-y-2">
                <p className="text-muted-foreground">Invite friends using referral code</p>
                <p className="text-muted-foreground font-medium">Earn 5 Bondhu Coins when:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Friend registers</li>
                  <li>Friend posts a task</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">9</span>
                Wallet & Transactions
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>Earnings are credited after verification</li>
                <li>Platform reserves the right to hold payments in case of suspicious activity</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">10</span>
                Flexibility
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>No fixed working hours</li>
                <li>Users can choose tasks freely</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">11</span>
                Operational Scope
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>BondhuApp mainly operates within college campus ecosystems</li>
                <li>Services outside this scope are not guaranteed</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">12</span>
                Limitation of Liability
              </h2>
              <div className="pl-10 space-y-2">
                <p className="text-muted-foreground">BondhuApp provides services "as-is"</p>
                <p className="text-muted-foreground font-medium">We are not responsible for:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Task failure</li>
                  <li>Disputes between users</li>
                  <li>External/off-platform issues</li>
                </ul>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">13</span>
                Misuse & Legal Action
              </h2>
              <div className="pl-10 space-y-2">
                <p className="text-muted-foreground">Any misuse of the platform may lead to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Account termination</li>
                  <li>Legal consequences</li>
                </ul>
              </div>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">14</span>
                Updates to Terms
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 pl-10 ml-2">
                <li>Terms may be updated anytime</li>
                <li>Continued use means acceptance of updated terms</li>
              </ul>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">15</span>
                Contact for Legal Queries
              </h2>
              <div className="pl-10">
                <a
                  href="mailto:bondhuappnow@gmail.com"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
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
