import React, { useState } from 'react';
import { Menu, X, ArrowDown, Sparkles, Check, HeartPulse, ShieldAlert, Stethoscope } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface AuraiHeroProps {
  onExploreEcosystem?: () => void;
  onOpenEmergency?: () => void;
  onOpenAuth?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const AuraiHero: React.FC<AuraiHeroProps> = React.memo(({
  onExploreEcosystem,
  onOpenEmergency,
  onOpenAuth,
  onSelectTab
}) => {
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeModal, setActiveModal] = useState<'story' | 'benefits' | 'connect' | null>(null);

  const submitTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }

    // Pause video when document is hidden to conserve mobile CPU/battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (!mediaQuery.matches) {
        videoRef.current?.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  const handleJoinListSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    setIsSubmitted(true);
    showToast('Thank you for joining the early access waitlist!', 'success');
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 4000);
  };

  const featurePills = [
    'Smart Therapy',
    'Real-time Healing',
    'Insights into outcomes'
  ];

  return (
    <div className="relative w-full max-w-full min-h-[100dvh] overflow-hidden bg-black text-white font-inter select-none">
      
      {/* Background Fullscreen Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260618_174853_aac61aa2-0f3f-4cf1-bc78-7f657dd11164.mp4"
        className="absolute inset-0 w-full h-full object-cover [object-position:80%_center] md:[object-position:right_center] lg:[object-position:center_center]"
      />

      {/* Content Overlay Layered Above Video */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between px-4 sm:px-10 lg:px-12 py-4 sm:py-8 pointer-events-none">
        
        {/* Top Navigation */}
        <nav className="flex items-center justify-between w-full z-20 pointer-events-auto relative">
          
          {/* Glassmorphism Left Pill */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-12 md:gap-16 transition-all shadow-xl">
            <div className="flex items-center gap-3">
              {/* Custom Four-Petal Pinwheel Logo */}
              <svg
                viewBox="0 0 256 256"
                className="w-5 h-5 sm:w-6 sm:h-6 text-white shrink-0 fill-current"
              >
                <path d="M 228 0 C 172.772 0 128 44.772 128 100 L 128 0 L 0 0 L 0 28 C 0 83.228 44.772 128 100 128 L 0 128 L 0 256 L 28 256 C 83.228 256 128 211.228 128 156 L 128 256 L 256 256 L 256 228 C 256 172.772 211.228 128 156 128 L 256 128 L 256 0 Z" />
              </svg>
              
              {/* Jevan Care Brand Name */}
              <span className="font-askan text-xl sm:text-2xl font-light text-white tracking-wide">
                Jevan Care
              </span>
            </div>

            {/* Hamburger / Close Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white transition-colors p-1 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Right Navigation Controls (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-3">
            {onOpenEmergency && (
              <button
                onClick={onOpenEmergency}
                className="bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-md text-rose-200 border border-rose-500/30 text-xs font-medium px-4 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Emergency SOS</span>
              </button>
            )}

            {onExploreEcosystem && (
              <button
                onClick={onExploreEcosystem}
                className="bg-black/30 hover:bg-black/40 backdrop-blur-md text-white border border-white/20 text-xs font-medium px-5 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              >
                <HeartPulse className="w-4 h-4 text-teal-400" />
                <span>Health Ecosystem</span>
              </button>
            )}

            <button
              onClick={() => {
                const el = document.getElementById('jevancare-email-form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else handleJoinListSubmit();
              }}
              className="bg-white text-black font-inter font-medium text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-all cursor-pointer shadow-lg hover:shadow-white/10"
            >
              Join the list
            </button>
          </div>

          {/* Mobile Menu Glass Panel */}
          {mobileMenuOpen && (
            <div className="absolute top-[4.5rem] left-0 right-0 sm:hidden z-30 bg-black/40 backdrop-blur-2xl rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col gap-4 text-white text-sm font-inter animate-in fade-in slide-in-from-top-2 pointer-events-auto">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
                <button
                  onClick={() => {
                    setActiveModal('story');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-white/80 hover:text-white py-1 font-medium transition-colors"
                >
                  Story
                </button>
                <button
                  onClick={() => {
                    setActiveModal('benefits');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-white/80 hover:text-white py-1 font-medium transition-colors"
                >
                  Benefits
                </button>
                <button
                  onClick={() => {
                    setActiveModal('connect');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-white/80 hover:text-white py-1 font-medium transition-colors"
                >
                  Connect
                </button>
              </div>

              {/* Quick Health Ecosystem Links */}
              {onSelectTab && (
                <div className="flex flex-col gap-2 border-b border-white/10 pb-4 text-xs">
                  <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">
                    Healthcare Ecosystem
                  </span>
                  <button
                    onClick={() => {
                      onSelectTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-emerald-300 font-medium py-1"
                  >
                    • Patient Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('assistant');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-white/80 py-1"
                  >
                    • AI Health Assistant
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('map');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-white/80 py-1"
                  >
                    • Nearby Hospitals & Labs
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('scanner');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-white/80 py-1"
                  >
                    • Prescription Scanner
                  </button>
                </div>
              )}

              {onOpenEmergency && (
                <button
                  onClick={() => {
                    onOpenEmergency();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-medium rounded-xl text-center flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Emergency SOS Hub</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('jevancare-email-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 bg-white text-black font-medium rounded-full text-center hover:bg-white/90 transition-all shadow-md"
              >
                Join the list
              </button>
            </div>
          )}
        </nav>

        {/* Mobile View Spacer to align main content toward the bottom */}
        <div className="flex-1 sm:hidden" />

        {/* Hero Content Section */}
        <div className="flex flex-col sm:flex-1 sm:flex-row sm:items-end justify-between pb-4 sm:pb-12 lg:pb-16 sm:mt-auto gap-6 pointer-events-auto">
          
          {/* Main Left Column */}
          <div className="flex flex-col items-start max-w-2xl">
            
            {/* Main Heading */}
            <h1 className="font-askan text-white text-[2rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-tight max-w-[700px] text-left">
              Your calm is always within.
            </h1>

            {/* Subtitle */}
            <p className="font-inter text-white/70 text-sm sm:text-base md:text-lg max-w-[520px] leading-relaxed mt-3 sm:mt-4 text-left font-light">
              Jevan Care is your always-on wellness companion. Built by leading therapists, it brings you the care and clarity right when you need it.
            </p>

            {/* Email CTA Form */}
            <form
              id="jevancare-email-form"
              onSubmit={handleJoinListSubmit}
              className="mt-6 sm:mt-8 relative flex items-center w-full max-w-[440px] bg-black/30 backdrop-blur-md rounded-full border border-white/10 p-1.5 focus-within:border-white/30 transition-all shadow-2xl"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none font-inter font-light"
              />
              <button
                type="submit"
                className="shrink-0 bg-white text-black font-inter font-medium text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full hover:bg-white/90 transition-all cursor-pointer whitespace-nowrap shadow-md flex items-center gap-1.5"
              >
                {isSubmitted ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Joined!</span>
                  </>
                ) : (
                  <span>Join the list</span>
                )}
              </button>
            </form>

            {/* Mobile Feature Pills (Placed below the email form on mobile) */}
            <div className="flex sm:hidden flex-wrap gap-2 mt-4">
              {featurePills.map((pill) => (
                <div
                  key={pill}
                  className="bg-black/30 backdrop-blur-md text-white/90 font-inter text-xs px-3.5 py-1.5 rounded-full border border-white/10 whitespace-nowrap"
                >
                  {pill}
                </div>
              ))}
            </div>

            {/* Scroll/Explore Indicator */}
            {onExploreEcosystem && (
              <button
                onClick={onExploreEcosystem}
                className="mt-6 hidden sm:flex items-center gap-2 text-white/60 hover:text-white text-xs font-inter font-light transition-colors group cursor-pointer"
              >
                <span>Scroll to explore healthcare ecosystem</span>
                <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform text-teal-400" />
              </button>
            )}
          </div>

          {/* Feature Pills (Desktop Right Column) */}
          <div className="hidden sm:flex flex-col items-end gap-2.5 self-end shrink-0 mb-2">
            {featurePills.map((pill) => (
              <div
                key={pill}
                className="bg-black/30 backdrop-blur-md text-white/90 font-inter text-xs sm:text-sm px-4 py-2 rounded-full border border-white/10 whitespace-nowrap hover:border-white/20 transition-all shadow-lg"
              >
                {pill}
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Modal Dialogs for Story, Benefits, Connect */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeModal === 'story' ? 'The Jevan Care Story' : activeModal === 'benefits' ? 'Key Benefits' : 'Connect with Jevan Care'}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-up"
        >
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white rounded-full bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'story' && (
              <div className="space-y-3 font-inter">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> The Jevan Care Story
                </div>
                <h3 className="font-askan text-3xl text-white">Built by leading clinicians</h3>
                <p className="text-white/70 text-sm leading-relaxed font-light">
                  Jevan Care was created to bridge the gap between clinical therapy and daily life. Powered by evidence-based cognitive protocols and real-time grounding, Jevan Care accompanies you through moments of distress, stress, and routine health navigation.
                </p>
              </div>
            )}

            {activeModal === 'benefits' && (
              <div className="space-y-3 font-inter">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4" /> Key Benefits
                </div>
                <h3 className="font-askan text-3xl text-white">Always-On Care & Clarity</h3>
                <ul className="space-y-2 text-white/80 text-sm font-light">
                  <li className="flex items-center gap-2">• Instant 24/7 empathetic grounding and guided breathwork</li>
                  <li className="flex items-center gap-2">• Seamless integration with personal health records & vitals</li>
                  <li className="flex items-center gap-2">• Verified clinical evidence & risk detection algorithms</li>
                </ul>
              </div>
            )}

            {activeModal === 'connect' && (
              <div className="space-y-3 font-inter">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <HeartPulse className="w-4 h-4" /> Connect with Jevan Care
                </div>
                <h3 className="font-askan text-3xl text-white">Join our pioneer community</h3>
                <p className="text-white/70 text-sm leading-relaxed font-light">
                  Have questions or want early access? Reach out at <span className="text-white font-medium">hello@jevancare.ai</span> or join our waitlist today.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-white text-black font-medium text-xs rounded-full hover:bg-white/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
