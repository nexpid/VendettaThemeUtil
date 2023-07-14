import { existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import os from "os";
import { join } from "path";
import prettier from "prettier";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const ips = [];
for (const x of Object.values(os.networkInterfaces()))
  for (const y of x)
    if (y.family === "IPv4" && y.internal === false) ips.push(y.address);

const fetchScript = `console.log(JSON.stringify({ colors: vendetta.metro.findByProps("SemanticColor", "RawColor"), debug: vendetta.debug.getDebugInfo() }))`;

const wss = new WebSocketServer({
  port: 6581,
});
const runWSS = () =>
  new Promise((res) => {
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        try {
          res(JSON.parse(JSON.parse(data.toString()).message));
          ws.close();
        } catch {
          console.log("Failed to parse data!");
        }
      });

      console.log("Connected!");
      setTimeout(() => {
        ws.send(fetchScript);
      }, 100);
    });
  });

wss.on("listening", () => {
  console.log(
    `Debugger started! Listening on:\n${ips
      .map((x) => `http://${x}:6581`)
      .join("\n")}\n`
  );
});

const data = await runWSS();
wss.close();
console.log("Parsed data");

const version = data.debug.discord.version;
const files = {
  RawColors: await prettier.format(JSON.stringify(data.colors.RawColor), {
    parser: "json",
  }),
  SemanticColors: await prettier.format(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(data.colors.SemanticColor).map(([x, y]) => [
          x,
          {
            source: Object.fromEntries(
              Object.entries(y).map((x) => [x[0], x[1].raw])
            ),
            colors: Object.fromEntries(
              Object.entries(y).map((x) => [
                x[0],
                data.colors.RawColor[x[1].raw],
              ])
            ),
          },
        ])
      )
    ),
    { parser: "json" }
  ),
};

const writeTo = async (dir) => {
  const pat = join(__dirname, "../colors", dir);
  if (!existsSync(pat)) await mkdir(pat);
  for (const [x, y] of Object.entries(files))
    await writeFile(join(pat, `${x}.json`), y);
  console.log(`Wrote to colors/${dir}`);
};

console.log("");
await writeTo("latest");
await writeTo(version);
