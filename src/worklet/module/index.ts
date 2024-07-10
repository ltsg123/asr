const SAMPLE_RATE = 16000;

let bufferCache: Float32Array[] = [];
function storeData(input: Float32Array): void {
  const length = bufferCache.length;
  if (length > 0 && bufferCache[length - 1].length < 4096) {
    const newBuffer = new Float32Array(
      bufferCache[length - 1].length + input.length
    );
    newBuffer.set(bufferCache[length - 1]);
    newBuffer.set(input, bufferCache[length - 1].length);
    bufferCache[length - 1] = newBuffer;
  } else if (length === 0 || bufferCache[length - 1].length === 4096) {
    const buffer = new Float32Array(input.length);
    buffer.set(input);
    bufferCache.push(buffer);
  } else {
  }
}

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

  console.log("result", curMessage, isEndpoint);

  return {
    sentence: sentence,
    text: curMessage,
    isEndpoint,
  };
}

export { speech2TextResult };
