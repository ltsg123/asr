import logger from "./logger";

const WebAudioContext =
  window.AudioContext || (window as any).webkitAudioContext;
let audioContext: AudioContext | null = null;

function createAudioContext(
  audioContextInitOptions: AudioContextOptions = {}
): void {
  if (!WebAudioContext) {
    // not support
    logger.error("your browser is not support web audio");
    return;
  }

  logger.info("create audio context");

  logger.debug(
    "audio context init option:",
    JSON.stringify(audioContextInitOptions)
  );
  audioContext = new WebAudioContext(audioContextInitOptions);
}

export function getAudioContext(
  audioContextInitOptions?: AudioContextOptions
): AudioContext {
  if (!audioContext) {
    createAudioContext(audioContextInitOptions);
    if (!audioContext) {
      logger.error("can not create audio context");
      throw new Error("can not create audio context");
    }
    return audioContext;
  }

  return audioContext;
}

export function hasAudioContext(): boolean {
  return !!audioContext;
}

export { createAudioContext };
