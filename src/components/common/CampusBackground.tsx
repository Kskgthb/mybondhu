export default function CampusBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Bondhu pattern background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/bg-pattern.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: '600px auto',
          backgroundPosition: 'center top',
        }}
      />

      {/* Light mode: subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-primary/5 dark:hidden" />

      {/* Dark mode: darken the pattern to blend with the dark theme */}
      <div className="absolute inset-0 hidden dark:block bg-[#1e1b4b]/85 mix-blend-multiply" />

      {/* Dark mode: subtle gradient overlay */}
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-transparent via-transparent to-primary/10" />
    </div>
  );
}
