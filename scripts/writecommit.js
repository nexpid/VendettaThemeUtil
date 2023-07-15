import { writeFile } from "fs/promises";
import getchanges from "./getchanges.js";

const folders = getchanges();

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
