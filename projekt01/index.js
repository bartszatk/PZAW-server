import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { URL } from "node:url";

const port = 8000;
const host = "localhost";

const index_html = readFileSync("index.html");
const favicon = readFileSync("favicon.ico");

const pathConfigs = [
  {
    path: "/",
    allowed_methods: ["GET"],
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(index_html);
    },
  },
  {
    path: "/hello",
    allowed_methods: ["GET"],
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("hello world!\n");
    },
  },
];

// Create a HTTP server
const server = createServer((req, res) => {
  const request_url = new URL(`http://${host}${req.url}`);
  const path = request_url.pathname;

  console.log(`Request: ${req.method} ${path}`);

  if (path === "/favicon.ico") {
    res.writeHead(200, { "Content-Type": "image/vnd.microsoft.icon" });
    res.end(favicon);
    return;
  }

  for (let config of pathConfigs) {
    if (path === config.path) {
      if (config.allowed_methods.includes(req.method)) {
        config.handler(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed\n");
      }
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found\n");
});


server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
