// Start file for cPanel "Setup Node.js App" (Passenger). Run `npm run build` first, then start this file.
const { createServer } = require("node:http");
const next = require("next");

const app = next({ dev: false, hostname: "0.0.0.0", port: Number(process.env.PORT) || 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(Number(process.env.PORT) || 3000);
}).catch((error) => { console.error(error); process.exit(1); });
