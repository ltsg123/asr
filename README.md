# ASR In Web

A simple automatic speech recognition library

## Source

Before you start, you need to download the model and placed in the public directory.

Reference: preinstall.sh.

## Using

```ts
async function start() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audio.srcObject = stream;

  console.log("support", ASR.isSupport());
  const asr = new ASR(stream.getAudioTracks()[0], {
    model: "sherpa-ncnn",
  });

  asr.on("message", (result, isEndpoint) => {
    console.log(result, isEndpoint);
  });
  asr.on("sentence", (result) => {
    console.log("sentence:", result);
  });

  // start monitor
  asr.start();
  // stop monitor
  asr.stop();
}
```

## build

yarn

yarn build

## dev

yarn

yarn dev

**Any questions you can contact me at [ltsg0317@outlook.com](mailto:ltsg0317@outlook.com)**
