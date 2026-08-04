import alertSoundUrl from '../assets/images/alert.mp3.mpeg?url';

let alertAudioInstance = null;
let isAudioUnlocked = false;

/**
 * Pre-unlock audio context on first user gesture anywhere in the web app
 */
export const unlockAudioContext = () => {
    if (isAudioUnlocked) return;
    try {
        const dummyAudio = new Audio(alertSoundUrl);
        dummyAudio.volume = 0.01;
        const p = dummyAudio.play();
        if (p !== undefined) {
            p.then(() => {
                dummyAudio.pause();
                dummyAudio.currentTime = 0;
                isAudioUnlocked = true;
            }).catch(() => {});
        }
    } catch (e) {}
};

// Global click / touch / key listener to unlock audio on first interaction
if (typeof window !== 'undefined') {
    const handler = () => {
        unlockAudioContext();
        window.removeEventListener('click', handler);
        window.removeEventListener('touchstart', handler);
        window.removeEventListener('keydown', handler);
    };
    window.addEventListener('click', handler, { passive: true });
    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('keydown', handler, { passive: true });
}

/**
 * Start playing the alert ringtone in loop (volume 1.0)
 */
export const startRingtone = () => {
    try {
        stopRingtone();
        const audio = new Audio(alertSoundUrl);
        audio.loop = true;
        audio.volume = 1.0;
        alertAudioInstance = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.warn('Autoplay prevented ringtone:', err.message);
                const retryUnlock = () => {
                    if (alertAudioInstance) {
                        alertAudioInstance.play().catch(e => console.warn('Retry play error:', e.message));
                    }
                    window.removeEventListener('click', retryUnlock);
                    window.removeEventListener('touchstart', retryUnlock);
                };
                window.addEventListener('click', retryUnlock);
                window.addEventListener('touchstart', retryUnlock);
            });
        }
    } catch (err) {
        console.warn('Failed to play ringtone:', err);
    }
};

/**
 * Stop the alert ringtone
 */
export const stopRingtone = () => {
    if (alertAudioInstance) {
        try {
            alertAudioInstance.pause();
            alertAudioInstance.currentTime = 0;
        } catch (e) {}
        alertAudioInstance = null;
    }
};

export default {
    startRingtone,
    stopRingtone,
    unlockAudioContext
};
