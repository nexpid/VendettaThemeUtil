import { writeFile } from "fs/promises";
import getchanges, { only } from "./getchanges.js";

const worker = process.argv[3] === "action";

const folder = process.argv[2];
if (typeof folder !== "string") throw new Error("No folder specified blehh");

const changes = getchanges(folder);
const folders = only(changes);

const dchanges = {
  added: folders
    .filter((x) => ["A", "??"].includes(x[0].trim()))
    .map((x) => x[1]),
  updated: folders.filter((x) => x[0].trim() === "M").map((x) => x[1]),
  deleted: folders.filter((x) => x[0].trim() === "D").map((x) => x[1]),
};

await writeFile(
  worker ? "./../tmp/commit.txt" : "./tmp/commit.txt",
  `chore${folder !== "" ? `(${folder})` : ""}: ${Object.entries(dchanges)
    .filter((x) => x[1][0])
    .map((x) => `${x[0]} ${x[1].join(", ")}`)
    .join(", ")}\n${folders.map((x) => `${x.join(" ")}`).join("\n")}`
);
