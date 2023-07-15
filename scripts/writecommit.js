import { execSync } from "child_process";
import { writeFile } from "fs/promises";

const changes = execSync("git status -z -uall")
  .toString()
  .split("\0")
  .filter((x) => x.slice(3).startsWith("colors/"));

const folders = changes.map((x) => [
  x.slice(0, 2).trim(),
  x.slice(3).split("/")[1],
]);

const dchanges = {
  added: folders.filter((x) => ["A", "??"].includes(x[0])).map((x) => x[1]),
  updated: folders.filter((x) => x[0] === "M").map((x) => x[1]),
  deleted: folders.filter((x) => x[0] === "D").map((x) => x[1]),
};

await writeFile(
  "./commit.txt",
  `chore: ${Object.entries(dchanges)
    .filter((x) => x[1][0])
    .map((x) => `${x[0]} ${x[1].join(", ")}`)
    .join(", ")}\n${changes.map((x) => `- ${x}`).join("\n")}`
);
