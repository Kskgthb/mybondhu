// Generate notification sounds using Web Audio API

export const generateNotificationSound = (type: 'success' | 'arrival' | 'completion') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (frequency: number, duration: number, startTime: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
    
    oscillator.start(audioContext.currentTime + startTime);
    oscillator.stop(audioContext.currentTime + startTime + duration);
  };
  
  switch (type) {
    case 'success': // Task Accepted - Happy ascending tones
      playTone(523.25, 0.15, 0);    // C5
      playTone(659.25, 0.15, 0.15);  // E5
      playTone(783.99, 0.25, 0.3);   // G5
      break;
      
    case 'arrival': // Bondhu Arrived - Alert tones
      playTone(880, 0.2, 0);         // A5
      playTone(880, 0.2, 0.25);      // A5
      break;
      
    case 'completion': // Task Completed - Victory tones
      playTone(523.25, 0.15, 0);     // C5
      playTone(659.25, 0.15, 0.15);  // E5
      playTone(783.99, 0.15, 0.3);   // G5
      playTone(1046.5, 0.3, 0.45);   // C6
      break;
  }
};
