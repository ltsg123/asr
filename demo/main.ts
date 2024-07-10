import { setupMic } from "./media";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
  <h1>Audio Stream Recognition In Web</h1>
    <button id="start">ENABLE</button>
    <button id="stop">DISABLE</button>
    <div class="card">
      <section class="player-card">
      <textarea id="results" rows="30" readonly></textarea>
      </section>
  </div>
`;

setupMic();
