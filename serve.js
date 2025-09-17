import { watch } from "fs";

let server;

function createServer() {
  return Bun.serve({
    port: 8000,
    routes: {
      // Serve the main HTML file
      "/": new Response(Bun.file("./dist/index.html")),

      // Serve static assets
      "/main.js": new Response(Bun.file("./dist/main.js"), {
        headers: { "Content-Type": "application/javascript" }
      }),
      "/style.css": new Response(Bun.file("./dist/style.css"), {
        headers: { "Content-Type": "text/css" }
      }),
    },

    // Fallback for other routes
    fetch(req) {
      const url = new URL(req.url);

      // Try to serve files from dist directory
      const filePath = `./dist${url.pathname}`;
      const file = Bun.file(filePath);

      // Check if file exists by trying to read it
      return new Response(file);
    },

    development: true
  });
}

async function rebuildAndReload() {
  console.log("🔄 Rebuilding...");

  // Run the build process
  const buildProcess = Bun.spawn(["bun", "run", "build"], {
    cwd: process.cwd(),
    stdio: ["inherit", "inherit", "inherit"],
  });

  await buildProcess.exited;

  if (buildProcess.exitCode === 0) {
    console.log("✅ Build successful, reloading server...");

    // Reload the server with new files
    server.reload({
      routes: {
        "/": new Response(Bun.file("./dist/index.html")),
        "/main.js": new Response(Bun.file("./dist/main.js"), {
          headers: { "Content-Type": "application/javascript" }
        }),
        "/style.css": new Response(Bun.file("./dist/style.css"), {
          headers: { "Content-Type": "text/css" }
        }),
      },
      fetch(req) {
        const url = new URL(req.url);
        const filePath = `./dist${url.pathname}`;
        const file = Bun.file(filePath);
        return new Response(file);
      },
      development: true
    });
  } else {
    console.log("❌ Build failed");
  }
}

// Initial server start
server = createServer();
console.log(`🕌 Prayer Times Calculator running at http://localhost:${server.port}`);
console.log("👀 Watching for changes in src/ directory...");

// Watch for changes in src directory
watch("./src", { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`📝 File changed: ${filename}`);
    rebuildAndReload();
  }
});