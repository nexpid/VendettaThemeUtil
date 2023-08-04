import { execSync } from "child_process";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const ghBody = (version) =>
  JSON.stringify({
    ref: "main",
    inputs: {
      version,
    },
  });
const ghArgs = [
  "-X POST",
  '-H "Accept: application/vnd.github+json"',
  '-H "X-GitHub-Api-Version: 2022-11-28"',
  '-F ref="main"',
  "repos/Gabe616/VendettaThemeUtil/actions/workflows/runner.yml/dispatches",
  "--input -",
];
const runWorkflow = (ver) =>
  execSync(`echo ${ghBody(ver)} | gh api ${ghArgs.join(" ")}`);

cron.schedule("0,30 * * * * *", async () => {
  const versions = await (await fetch("https://vd.k6.tf/tracker/index")).json();
  const current = versions.latest.alpha.toString();
  const last = await readFile(join(__dirname, "lastVersion.txt"), "utf8");

  if (last !== "" && current !== last) {
    console.log(`New Discord Alpha! ${last} -> ${current}`);
    console.log(
      `API Response: ${runWorkflow(current).toString() ?? "<empty>"}`
    );
  }

  await writeFile(join(__dirname, "lastVersion.txt"), current);
});
