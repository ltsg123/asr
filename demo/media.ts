import ASR from "../src";
// import "../dist/index.js";

let stream: MediaStream;

const audio = document.createElement("audio");

export async function setupMic() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audio.srcObject = stream;

  console.log("support", ASR.isSupport());
  const asr = new ASR(stream.getAudioTracks()[0], {
    model: "sherpa-ncnn",
  });
  bindEvents(asr);

  asr.start();
}

function bindEvents(asr) {
  let index = 0;
  const textarea = document.getElementById("results") as HTMLTextAreaElement;
  document.getElementById("start")?.addEventListener("click", () => {
    asr.start();
  });

  document.getElementById("stop")?.addEventListener("click", () => {
    asr.stop();
    textarea.innerHTML = "";
    index = 0;
  });

  asr.on("message", (result, isEndpoint) => {
    if (textarea.innerHTML === "") {
      textarea.innerHTML = `[${index}]: `;
    }
    console.log("message:", result, result.length);
    textarea.value += result;
    if (isEndpoint) {
      textarea.value += "\n";
      textarea.value += `[${++index}]: `;
    }
  });
  asr.on("sentence", (result) => {
    console.log("sentence:", result);
  });
}
