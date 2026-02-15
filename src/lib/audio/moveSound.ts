import { boardState } from "../stores/board";

let audioContext: AudioContext | null = null;

const ensureAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.AudioContext) {
    return null;
  }

  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  return audioContext;
};

const primeAudio = (): void => {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }
};

const playMoveSound = (): void => {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
    return;
  }

  const now = context.currentTime;

  // 1) Hard contact click.
  const attackDuration = 0.01;
  const noiseLength = Math.floor(context.sampleRate * attackDuration);
  const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i += 1) {
    noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
  }

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const attackFilter = context.createBiquadFilter();
  attackFilter.type = "bandpass";
  attackFilter.frequency.setValueAtTime(3200, now);
  attackFilter.Q.setValueAtTime(1.1, now);

  const attackGain = context.createGain();
  attackGain.gain.setValueAtTime(0.0001, now);
  attackGain.gain.exponentialRampToValueAtTime(0.1, now + 0.0015);
  attackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

  noiseSource.connect(attackFilter);
  attackFilter.connect(attackGain);
  attackGain.connect(context.destination);
  noiseSource.start(now);
  noiseSource.stop(now + attackDuration);

  // 2) Small "clack" partial.
  const clackOsc = context.createOscillator();
  clackOsc.type = "triangle";
  clackOsc.frequency.setValueAtTime(980, now);
  clackOsc.frequency.exponentialRampToValueAtTime(700, now + 0.03);

  const clackGain = context.createGain();
  clackGain.gain.setValueAtTime(0.0001, now);
  clackGain.gain.exponentialRampToValueAtTime(0.03, now + 0.002);
  clackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  clackOsc.connect(clackGain);
  clackGain.connect(context.destination);
  clackOsc.start(now);
  clackOsc.stop(now + 0.045);

  // 3) Board resonance (two damped modes).
  const bodyFilter = context.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(900, now);
  bodyFilter.Q.setValueAtTime(0.7, now);

  const bodyOscA = context.createOscillator();
  bodyOscA.type = "sine";
  bodyOscA.frequency.setValueAtTime(165, now);
  bodyOscA.frequency.exponentialRampToValueAtTime(125, now + 0.12);

  const bodyOscB = context.createOscillator();
  bodyOscB.type = "sine";
  bodyOscB.frequency.setValueAtTime(285, now);
  bodyOscB.frequency.exponentialRampToValueAtTime(220, now + 0.09);

  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.06, now + 0.006);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

  bodyOscA.connect(bodyFilter);
  bodyOscB.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(context.destination);
  bodyOscA.start(now);
  bodyOscB.start(now);
  bodyOscA.stop(now + 0.11);
  bodyOscB.stop(now + 0.095);
};

export const setupMoveSound = (): (() => void) => {
  let prevMoveNumber: number | null = null;

  const onUserGesture = () => {
    primeAudio();
  };

  window.addEventListener("pointerdown", onUserGesture, { passive: true });
  window.addEventListener("keydown", onUserGesture);

  const unsubscribe = boardState.subscribe((state) => {
    if (prevMoveNumber === null) {
      prevMoveNumber = state.moveNumber;
      return;
    }

    if (state.moveNumber > prevMoveNumber) {
      playMoveSound();
    }

    prevMoveNumber = state.moveNumber;
  });

  return () => {
    window.removeEventListener("pointerdown", onUserGesture);
    window.removeEventListener("keydown", onUserGesture);
    unsubscribe();
  };
};
