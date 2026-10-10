import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local booking backend for `npm run dev` / `npm run preview`.
 *
 * Serves THIS site's own Netlify function (netlify/functions/booking.ts,
 * bundled) with its fetch bridged to the in-process simulator in
 * scripts/demo-runtime.mjs — a self-contained runtime that runs this
 * folder's own external-backend/.gs sources in a fake-Google vm. The whole
 * folder is movable: no path leaves it, so the site works the same after
 * copying it anywhere. Everything stays on this machine; the "mail" lands
 * in an in-memory inbox, plus real SMTP delivery if demo-mail.local.json is
 * configured.
 *
 * This is why the two-phase booking flow (step-1 INCOMPLETE create with the
 * 3-minute follow-up, then request.complete which cancels it) works under
 * plain `npm run dev`. Only active for local hostnames; a production deploy
 * is unaffected — the function there is a real Netlify Function and this
 * plugin never runs at runtime.
 */
function localBookingBackend(): Plugin {
  const isLocal = (host: string) => {
    try {
      return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(`http://${host}`).hostname);
    } catch {
      return false;
    }
  };
  let runtime: { handler: (req: Request) => Promise<Response> } | null = null;
  // Shared request handling for dev + preview — both serve the real
  // function in-process.
  const middleware = async (req: any, res: any, next: any) => {
    try {
      if (!req.url || !req.url.startsWith("/.netlify/functions/booking")) return next();
      if (!isLocal(req.headers.host ?? "localhost")) return next();
      if (!runtime) {
        // Lazy-import so `vite build` (no server) never loads the runtime,
        // and a failure here never breaks plain UI development.
        const { createDemoRuntime, startWorker } = await import(
          pathToFileURL(path.resolve(__dirname, "scripts", "demo-runtime.mjs")).href
        );
        const created = createDemoRuntime({
          functionPath: path.resolve(__dirname, "netlify", "functions", "booking.ts"),
          // Nakhla's own fork of the external backend, so the demo emails
          // (receipt + follow-up) are branded عيادات نخلة / Nakhla Dental
          // and never say the other clinic's name.
          externalPath: path.resolve(__dirname, "external-backend"),
          mailFromName: "Nakhla Dental DEMO",
        });
        runtime = created as { handler: (req: Request) => Promise<Response> };
        startWorker((created as any).sim, 10000);
        console.log("  🌴  booking: دالة حجز نخلة + محاكاة النظام الخارجي تعملان داخل الخادم المحلي");
      }
      const rt = runtime;
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks).toString("utf8");
      const origin = (req.headers.origin as string) || `http://${req.headers.host}`;
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: "POST",
        headers: {
          "content-type": (req.headers["content-type"] as string) || "application/json",
          origin,
          "x-nakhla-session": (req.headers["x-nakhla-session"] as string) || "",
        },
        body,
      });
      const response = await rt.handler(request);
      const text = await response.text();
      res.writeHead(response.status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(text);
    } catch (err) {
      const detail = String((err as Error)?.message || err);
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, reason: "SERVER_ERROR", detail }));
    }
  };
  return {
    name: "nakhla-local-booking",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), localBookingBackend()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
