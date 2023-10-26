import { execSync } from "child_process";

export function only(x) {
  return x.filter(
    (x, i, a) =>
      !a
        .slice(0, i)
        .map((y) => y[1])
        .includes(x[1])
  );
}

export default function (folder) {
  const changes = execSync("git status -z -uall")
    .toString()
    .split("\0")
    .filter((x) =>
      folder !== "" ? x.slice(3).startsWith(`${folder}/`) : true
    );

  return changes.map((x) => [x.slice(0, 2), x.slice(3).split("/")[1]]);
}
