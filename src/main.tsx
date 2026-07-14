import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";

// Após um novo deploy, abas já abertas ainda referenciam os nomes de chunk
// (hash) antigos, que somem do servidor quando o build novo sobrescreve os
// assets. Isso derruba o import() dinâmico das rotas lazy com "Failed to
// fetch dynamically imported module". Recarrega a página uma vez para pegar
// o index.html atualizado (com os hashes certos) em vez de deixar o erro cru.
const RELOAD_FLAG = "chunk-reload-attempted";

function recoverFromStaleChunk() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
}

window.addEventListener("vite:preloadError", recoverFromStaleChunk);
window.addEventListener("unhandledrejection", (e) => {
  if (/failed to fetch dynamically imported module/i.test(String(e.reason?.message ?? e.reason))) {
    recoverFromStaleChunk();
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Se chegamos até aqui é porque o carregamento atual deu certo — libera o
// guard para que um novo deploy futuro (nesta mesma aba, sessão longa) ainda
// consiga disparar um reload automático em vez de ficar bloqueado para sempre.
setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);
