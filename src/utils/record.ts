import { flatArray, toWav } from "./helper";

export const testwav: Int16Array[] = [];
function record(samples: Float32Array) {
  let buf = new Int16Array(samples.length);
  for (var i = 0; i < samples.length; ++i) {
    let s = samples[i];
    if (s >= 1) s = 1;
    else if (s <= -1) s = -1;

    samples[i] = s;
    buf[i] = s * 32767;
  }

  testwav.push(buf);
}

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function flatten(listOfSamples: Int16Array[]) {
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

function stopRecord() {
  return flatten(testwav);
}

export { record, stopRecord };
