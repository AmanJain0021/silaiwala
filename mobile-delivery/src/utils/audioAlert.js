// Port of utils/audioAlert.js: loop the same alert sound (assets/sounds/alert.mp3) for a new delivery task.
// Native has no autoplay restriction, so the web's "unlock on first tap" logic is not needed.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const alertSound = require('../../assets/sounds/alert.mp3');
let player = null;

export const unlockAudioContext = () => {};

export const startRingtone = () => {
  try {
    stopRingtone();
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
    player = createAudioPlayer(alertSound);
    player.loop = true;
    player.volume = 1.0;
    player.play();
  } catch (err) {
    console.warn('Failed to play ringtone:', err);
  }
};

export const stopRingtone = () => {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch (_) { /* already released */ }
  player = null;
};

export default { startRingtone, stopRingtone, unlockAudioContext };
