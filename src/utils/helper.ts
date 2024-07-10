function getRandomString(length: number = 7, prefix: string = ""): string {
  const str = Math.random().toString(16).substr(2, length).toLowerCase();
  if (str.length === length) return `${prefix}${str}`;

  return `${prefix}${str}` + getRandomString(length - str.length, "");
}

/**
 * 支持 ASR 的三种方式
 * 1、createScriptProcessor 在主线程上执行
 * 2、insertableStream 在webworker上执行
 * 3、audioWorklet 上执行
 * @returns
 */
function isSupportASR(): boolean {
  if (!isSupportWebAssembly()) {
    return false;
  }
  const isSupportScriptProcessor =
    "createScriptProcessor" in AudioContext.prototype ||
    "createJavaScriptNode" in AudioContext.prototype;
  return isSupportScriptProcessor;
}

function isSupportAudioWorklet() {
  try {
    return !!globalThis.AudioWorklet && !!globalThis.AudioWorkletNode;
  } catch (_error) {
    return false;
  }
}

function isSupportWebAssembly() {
  try {
    return !!globalThis.WebAssembly && !!globalThis.WebAssembly.instantiate;
  } catch (_error) {
    return false;
  }
}

// 二维转一维
function flatArray(list: Float32Array[]): Float32Array {
  // 拿到总长度
  const length = list.length * list[0].length;
  const data = new Float32Array(length);
  let offset = 0;
  for (let i = 0; i < list.length; i++) {
    data.set(list[i], offset);
    offset += list[i].length;
  }
  return data;
}

function concatFloat32Arrays(
  array1: Float32Array,
  array2: Float32Array
): Float32Array {
  let result = new Float32Array(array1.length + array2.length);
  result.set(array1);
  result.set(array2, array1.length);
  return result;
}

const expectedSampleRate = 16000;

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function toWav(samples: Int16Array) {
  let buf = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buf);

  // http://soundfile.sapp.org/doc/WaveFormat/
  //                   F F I R
  view.setUint32(0, 0x46464952, true); // chunkID
  view.setUint32(4, 36 + samples.length * 2, true); // chunkSize
  //                   E V A W
  view.setUint32(8, 0x45564157, true); // format
  //
  //                      t m f
  view.setUint32(12, 0x20746d66, true); // subchunk1ID
  view.setUint32(16, 16, true); // subchunk1Size, 16 for PCM
  view.setUint32(20, 1, true); // audioFormat, 1 for PCM
  view.setUint16(22, 1, true); // numChannels: 1 channel
  view.setUint32(24, expectedSampleRate, true); // sampleRate
  view.setUint32(28, expectedSampleRate * 2, true); // byteRate
  view.setUint16(32, 2, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  view.setUint32(36, 0x61746164, true); // Subchunk2ID
  view.setUint32(40, samples.length * 2, true); // subchunk2Size

  let offset = 44;
  for (let i = 0; i < samples.length; ++i) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function flatten(listOfSamples: Float32Array[]) {
  let n = 0;
  for (let i = 0; i < listOfSamples.length; ++i) {
    n += listOfSamples[i].length;
  }
  let ans = new Int16Array(n);

  let offset = 0;
  for (let i = 0; i < listOfSamples.length; ++i) {
    ans.set(listOfSamples[i], offset);
    offset += listOfSamples[i].length;
  }
  return ans;
}

export {
  getRandomString,
  isSupportASR,
  flatArray,
  toWav,
  flatten,
  concatFloat32Arrays,
};
