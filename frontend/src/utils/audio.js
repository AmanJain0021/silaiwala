export const playNotificationSound = (role = 'customer') => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const playTone = (freq, startTime, duration, type = 'sine') => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        
        if (role === 'delivery') {
            // Energetic, attention-grabbing triple beep (like a dispatch alert)
            playTone(880.00, now, 0.1, 'square');       // A5
            playTone(1046.50, now + 0.15, 0.1, 'square'); // C6
            playTone(1318.51, now + 0.3, 0.25, 'square'); // E6
        } else if (role === 'tailor') {
            // Professional, crisp double chime
            playTone(523.25, now, 0.15, 'sine');       // C5
            playTone(659.25, now + 0.2, 0.3, 'sine');  // E5
        } else {
            // Customer: Soft, gentle pleasant chime
            playTone(880, now, 0.15, 'sine');       // A5
            playTone(1108.73, now + 0.15, 0.3, 'sine'); // C#6
        }
    } catch(e) {
        console.error("Audio API error:", e);
    }
};
