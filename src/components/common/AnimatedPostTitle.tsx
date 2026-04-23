import { useState, useEffect } from 'react';

interface AnimatedPostTitleProps {
  /** Color for the word "Post" */
  postColor?: string;
  /** Color for the word "First" */
  firstColor?: string;
  /** Color for the curved underline under "First" */
  underlineColor?: string;
  /** Suffix after the last word (e.g. "!!") */
  suffix?: string;
}

/**
 * Animated typewriter heading: "Post Your First Task"
 * Words appear one-by-one with fade + slide-up animation.
 * "First" gets a curved SVG underline that draws itself in.
 */
export default function AnimatedPostTitle({
  postColor,
  firstColor,
  underlineColor = '#641acc',
  suffix = '',
}: AnimatedPostTitleProps) {
  const words = ['Post', 'Your', 'First', 'Task'];
  const [visibleCount, setVisibleCount] = useState(0);
  const [showUnderline, setShowUnderline] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    words.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 400 * (i + 1)));
    });
    // Draw underline after "First" appears (3rd word, index 2)
    timers.push(setTimeout(() => setShowUnderline(true), 400 * 3 + 250));
    return () => timers.forEach(clearTimeout);
  }, []);

  const getWordColor = (word: string) => {
    if (word === 'Post' && postColor) return postColor;
    if (word === 'First' && firstColor) return firstColor;
    return undefined;
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: '0.35em',
        justifyContent: 'center',
      }}
    >
      {words.map((word, i) => {
        const isFirst = word === 'First';
        const isLast = i === words.length - 1;
        const color = getWordColor(word);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              position: 'relative',
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              color: color || 'inherit',
            }}
          >
            {word}
            {isLast && suffix}
            {isFirst && (
              <svg
                viewBox="0 0 70 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '-4%',
                  width: '108%',
                  height: '12px',
                  overflow: 'visible',
                }}
              >
                <path
                  d="M2 9 C 15 2, 55 2, 68 9"
                  stroke={underlineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    strokeDasharray: 80,
                    strokeDashoffset: showUnderline ? 0 : 80,
                    transition: 'stroke-dashoffset 0.5s ease',
                  }}
                />
              </svg>
            )}
          </span>
        );
      })}
    </span>
  );
}
