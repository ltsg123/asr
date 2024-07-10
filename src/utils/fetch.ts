import sherpaWasmUrl from "/sherpa-ncnn/sherpa-ncnn-wasm-main.wasm?url";
import sherpaDataUrl from "/sherpa-ncnn/sherpa-ncnn-wasm-main.data?url";
import { ModelSource, ModelType } from "../types";

async function fetchWasmSource(model: ModelType): Promise<ModelSource> {
  let wasmUrl = "";
  let dataUrl = "";
  if (model === "sherpa-ncnn") {
    wasmUrl = sherpaWasmUrl;
    dataUrl = sherpaDataUrl;
  }

  const wasm = await fetchFile(wasmUrl);
  const data = await fetchFile(dataUrl);

  return {
    type: model,
    wasm,
    data,
  };
}

function fetchFile(fileName: string): Promise<ArrayBuffer> {
  return fetch(fileName).then((response) => {
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(
      `Failed to fetch the file ${fileName} with status ${response.status}`
    );
  });
}

export { fetchWasmSource };
