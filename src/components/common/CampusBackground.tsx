export default function CampusBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Primary background color #f1f5f9 for light mode, #1e1b4b for dark mode */}
      <div className="absolute inset-0 bg-[#f1f5f9] dark:bg-[#1e1b4b]" />
      
      {/* Illustrated elements scattered across the background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A8B24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2d6b1c" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="secondaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7E00" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e67000" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD43B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f5c71a" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Building - Top Left */}
        <g transform="translate(50, 40)" opacity="0.15" className="dark:opacity-[0.08]">
          <rect x="0" y="30" width="80" height="100" fill="url(#primaryGrad)" rx="4" />
          <rect x="10" y="40" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="30" y="40" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="55" y="40" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="10" y="60" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="30" y="60" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="55" y="60" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="10" y="80" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="30" y="80" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="55" y="80" width="15" height="15" fill="#f1f5f9" opacity="0.7" />
          <rect x="25" y="100" width="30" height="30" fill="#f1f5f9" opacity="0.8" />
        </g>

        {/* Student with Bicycle - Top Right */}
        <g transform="translate(calc(100vw - 200), 60)" opacity="0.12" className="dark:opacity-[0.06]">
          {/* Bicycle */}
          <circle cx="20" cy="70" r="15" fill="none" stroke="url(#secondaryGrad)" strokeWidth="3" />
          <circle cx="70" cy="70" r="15" fill="none" stroke="url(#secondaryGrad)" strokeWidth="3" />
          <line x1="20" y1="70" x2="45" y2="40" stroke="url(#secondaryGrad)" strokeWidth="3" />
          <line x1="70" y1="70" x2="45" y2="40" stroke="url(#secondaryGrad)" strokeWidth="3" />
          <line x1="35" y1="55" x2="55" y2="55" stroke="url(#secondaryGrad)" strokeWidth="3" />
          <line x1="45" y1="40" x2="45" y2="25" stroke="url(#secondaryGrad)" strokeWidth="3" />
          {/* Student head */}
          <circle cx="45" cy="15" r="10" fill="url(#primaryGrad)" />
          {/* Backpack */}
          <rect x="40" y="25" width="15" height="20" fill="url(#accentGrad)" rx="2" />
        </g>

        {/* Mobile Phone with Notification - Left Side */}
        <g transform="translate(80, calc(50vh - 100))" opacity="0.13" className="dark:opacity-[0.07]">
          <rect x="0" y="0" width="60" height="100" fill="url(#primaryGrad)" rx="8" />
          <rect x="5" y="10" width="50" height="70" fill="#f1f5f9" opacity="0.9" rx="4" />
          {/* Notification badge */}
          <circle cx="50" cy="15" r="8" fill="url(#secondaryGrad)" />
          <text x="50" y="19" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">3</text>
          {/* Screen content lines */}
          <rect x="10" y="20" width="40" height="4" fill="url(#primaryGrad)" opacity="0.6" rx="2" />
          <rect x="10" y="30" width="35" height="4" fill="url(#primaryGrad)" opacity="0.4" rx="2" />
          <rect x="10" y="40" width="30" height="4" fill="url(#primaryGrad)" opacity="0.4" rx="2" />
        </g>

        {/* Task Post Card - Bottom Left */}
        <g transform="translate(60, calc(100vh - 200))" opacity="0.14" className="dark:opacity-[0.07]">
          <rect x="0" y="0" width="120" height="80" fill="url(#primaryGrad)" rx="8" />
          <rect x="5" y="5" width="110" height="70" fill="#f1f5f9" opacity="0.9" rx="6" />
          {/* Task icon */}
          <rect x="15" y="15" width="30" height="30" fill="url(#accentGrad)" rx="4" />
          {/* Task lines */}
          <rect x="50" y="15" width="55" height="6" fill="url(#primaryGrad)" opacity="0.5" rx="3" />
          <rect x="50" y="27" width="45" height="5" fill="url(#primaryGrad)" opacity="0.3" rx="2" />
          <rect x="50" y="37" width="40" height="5" fill="url(#primaryGrad)" opacity="0.3" rx="2" />
          {/* Button */}
          <rect x="15" y="55" width="90" height="15" fill="url(#secondaryGrad)" rx="7" />
        </g>

        {/* Geolocation Pointer - Center Right */}
        <g transform="translate(calc(100vw - 150), calc(50vh - 50))" opacity="0.15" className="dark:opacity-[0.08]">
          <path d="M 30 10 Q 30 0 40 0 Q 50 0 50 10 Q 50 25 40 50 Q 30 25 30 10 Z" fill="url(#secondaryGrad)" />
          <circle cx="40" cy="12" r="6" fill="#f1f5f9" opacity="0.9" />
          {/* Pulse rings */}
          <circle cx="40" cy="50" r="15" fill="none" stroke="url(#secondaryGrad)" strokeWidth="2" opacity="0.4" />
          <circle cx="40" cy="50" r="25" fill="none" stroke="url(#secondaryGrad)" strokeWidth="1.5" opacity="0.2" />
        </g>

        {/* Money Icon - Top Center */}
        <g transform="translate(calc(50vw - 40), 80)" opacity="0.13" className="dark:opacity-[0.07]">
          <circle cx="40" cy="40" r="35" fill="url(#accentGrad)" />
          <text x="40" y="55" textAnchor="middle" fill="#3A8B24" fontSize="40" fontWeight="bold">₹</text>
          {/* Coins scattered */}
          <circle cx="10" cy="20" r="8" fill="url(#accentGrad)" opacity="0.7" />
          <circle cx="70" cy="25" r="10" fill="url(#accentGrad)" opacity="0.6" />
          <circle cx="15" cy="65" r="7" fill="url(#accentGrad)" opacity="0.8" />
        </g>

        {/* Task Done Tick Mark - Bottom Right */}
        <g transform="translate(calc(100vw - 180), calc(100vh - 180))" opacity="0.14" className="dark:opacity-[0.07]">
          <circle cx="50" cy="50" r="45" fill="url(#primaryGrad)" />
          <polyline points="25,50 42,67 75,34" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Group of Students - Bottom Center */}
        <g transform="translate(calc(50vw - 100), calc(100vh - 150))" opacity="0.12" className="dark:opacity-[0.06]">
          {/* Student 1 */}
          <circle cx="30" cy="30" r="15" fill="url(#primaryGrad)" />
          <rect x="20" y="45" width="20" height="35" fill="url(#primaryGrad)" rx="10" />
          {/* Student 2 */}
          <circle cx="70" cy="25" r="15" fill="url(#secondaryGrad)" />
          <rect x="60" y="40" width="20" height="35" fill="url(#secondaryGrad)" rx="10" />
          {/* Student 3 */}
          <circle cx="110" cy="30" r="15" fill="url(#accentGrad)" />
          <rect x="100" y="45" width="20" height="35" fill="url(#accentGrad)" rx="10" />
          {/* Student 4 */}
          <circle cx="150" cy="28" r="15" fill="url(#primaryGrad)" />
          <rect x="140" y="43" width="20" height="35" fill="url(#primaryGrad)" rx="10" />
        </g>

        {/* "Trust Delivered" Text - Top Left Area */}
        <g transform="translate(150, 100)" opacity="0.1" className="dark:opacity-[0.05]">
          <text x="0" y="0" fill="url(#primaryGrad)" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">
            Trust Delivered
          </text>
        </g>

        {/* "Bondhu Community" Text - Right Side */}
        <g transform="translate(calc(100vw - 280), calc(50vh + 80))" opacity="0.1" className="dark:opacity-[0.05]">
          <text x="0" y="0" fill="url(#secondaryGrad)" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">
            Bondhu Community
          </text>
        </g>

        {/* "Need Bondhu" Button - Left Center */}
        <g transform="translate(100, calc(50vh + 100))" opacity="0.12" className="dark:opacity-[0.06]">
          <rect x="0" y="0" width="140" height="45" fill="url(#primaryGrad)" rx="22" />
          <text x="70" y="30" textAnchor="middle" fill="#f1f5f9" fontSize="16" fontWeight="bold">Need Bondhu</text>
        </g>

        {/* "Become a Bondhu" Button - Right Center */}
        <g transform="translate(calc(100vw - 280), calc(50vh - 150))" opacity="0.12" className="dark:opacity-[0.06]">
          <rect x="0" y="0" width="160" height="45" fill="url(#secondaryGrad)" rx="22" />
          <text x="80" y="30" textAnchor="middle" fill="#f1f5f9" fontSize="16" fontWeight="bold">Become a Bondhu</text>
        </g>

        {/* Additional decorative elements */}
        {/* Small task cards scattered */}
        <g transform="translate(calc(50vw + 150), 200)" opacity="0.08" className="dark:opacity-[0.04]">
          <rect x="0" y="0" width="60" height="40" fill="url(#accentGrad)" rx="6" />
        </g>
        
        <g transform="translate(200, calc(50vh - 50))" opacity="0.08" className="dark:opacity-[0.04]">
          <rect x="0" y="0" width="50" height="35" fill="url(#primaryGrad)" rx="5" />
        </g>

        {/* Connecting lines/paths suggesting network */}
        <path d="M 100 150 Q 200 200 300 180" stroke="url(#primaryGrad)" strokeWidth="2" fill="none" opacity="0.1" className="dark:opacity-[0.05]" strokeDasharray="5,5" />
        <path d="M calc(100vw - 200) 150 Q calc(100vw - 300) 250 calc(100vw - 250) 300" stroke="url(#secondaryGrad)" strokeWidth="2" fill="none" opacity="0.1" className="dark:opacity-[0.05]" strokeDasharray="5,5" />
      </svg>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 dark:to-primary/10" />
    </div>
  );
}
