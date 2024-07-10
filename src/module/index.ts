const SAMPLE_RATE = 16000;
let lastResult = "";

function speech2TextResult(
  samples: Float32Array,
  module: any = {}
):
  | {
      sentence: string;
      text: string;
      isEndpoint: boolean;
    }
  | undefined {
  const { recognizer_stream, recognizer } = module;
  if (!recognizer_stream || !recognizer) {
    return;
  }

  recognizer_stream.acceptWaveform(SAMPLE_RATE, samples);

  while (recognizer.isReady(recognizer_stream)) {
    recognizer.decode(recognizer_stream);
  }

  let isEndpoint = recognizer.isEndpoint(recognizer_stream);
  let result = recognizer.getResult(recognizer_stream);
  const curMessage = result.replace(lastResult, "");

  if (result.length > 0 && lastResult != result) {
    lastResult = result;
  }

  let sentence = lastResult;
  if (isEndpoint) {
    if (lastResult.length > 0) {
      lastResult = "";
    }
    recognizer.reset(recognizer_stream);
  }

  return {
    sentence: sentence,
    text: curMessage,
    isEndpoint,
  };
}

export { speech2TextResult };
