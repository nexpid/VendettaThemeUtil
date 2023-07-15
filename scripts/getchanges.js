import { execSync } from "child_process";

export default function () {
  const changes = execSync("git status -z -uall")
    .toString()
    .split("\0")
    .filter((x) => x.slice(3).startsWith("colors/"));

  return changes
    .map((x) => [x.slice(0, 2).trim(), x.slice(3).split("/")[1]])
    .filter(
      (x, i, a) =>
        !a
          .slice(0, i)
          .map((y) => y[1])
          .includes(x[1])
    );
}
