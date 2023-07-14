import { execSync } from "child_process";
import { writeFile } from "fs/promises";

const changes = execSync("git status -z -uall").toString().split("\0");

const folders = changes
  .filter((x) => {
    const change = x.slice(0, 2);
    const file = x.slice(3);

    return ["??", "A "].includes(change) && file.startsWith("colors/");
  })
  .map((x) => x.slice(3).split("/")[1])
  .filter((x, i, a) => !a.slice(0, i).includes(x) && x !== "latest");

await writeFile("./scripts/commit.txt", `chore: add ${folders.join(", ")}`);
