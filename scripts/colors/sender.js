import { join } from "path";
import { execSync } from "child_process";
import getchanges, { only } from "../getchanges.js";
import { readFile, readdir } from "fs/promises";

process.emit = (
  (original) =>
  (...args) =>
    !(args[0] === "warning" && args[1]?.name === "ExperimentalWarning") &&
    original.apply(process, args)
)(process.emit);

const user = {
  name: "GitHub Actions",
  avatar:
    "https://cdn.discordapp.com/avatars/1033527398345482294/df91181b3f1cf0ef1592fbe18e0962d7.png",
};
const types = {
  json: "application/json",
  diff: "plain/text",
};

const webhook = process.argv.slice(2).join(" ");
if (!webhook) throw new Error("No webhook specified blehh");

const thread = "1129770152112697424";

const folders = only(getchanges("colors"))
  .filter((x) => ["A", "??"].includes(x[0].trim()) && x[1] !== "latest")
  .map((x) => x[1]);

let count = 0;
for (const x of folders) {
  const files = await readdir(join("colors", x));
  console.log(`Sending ${x} — ${files.join(", ")}`);

  const query = new URLSearchParams();
  query.append("wait", "true");
  if (thread) query.append("thread_id", thread);

  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const guh = file.split(".");

    const ext = guh.slice(-1)[0];
    const name = guh.slice(0, -1).join(".");

    const contentType = types[ext];
    const content = await readFile(join("colors", x, file));

    fd.append(
      `files[${i}]`,
      new Blob([content], { type: contentType }),
      `${name}-${x}.${ext}`
    );
  }

  fd.append(
    "payload_json",
    JSON.stringify({
      content: `Colors for **${x}**:\nConsider supporting me by starring [**VendettaThemeUtil**](https://github.com/Gabe616/VendettaThemeUtil/)!`,
      username: user.name,
      avatar_url: user.avatar,
      allowed_mentions: {
        parse: [],
      },
    })
  );
  const response = await (
    await fetch(`${webhook}?${query.toString()}`, {
      method: "POST",
      body: fd,
    })
  ).json();

  if (!response.id) {
    console.log(`Failed to send message 1 (${x})! ${JSON.stringify(response)}`);
    continue;
  }

  count++;

  const diff = execSync("git diff --cached colors/latest")
    .toString()
    .replace(/\r/g, "")
    .split("\n");

  const changes = {};
  for (let i = 0; i < diff.length; i++) {
    const l = diff[i];
    if (l.startsWith("diff --git")) {
      const file = l.split("/").reverse()[0];
      let target = i + 4;
      for (; target < diff.length; ) {
        if (diff[target].startsWith("diff --git")) break;
        target++;
      }

      changes[file.split(".").slice(0, -1).join(".")] = diff
        .slice(i + 4, target)
        .join("\n");
    }
  }

  const tooLarge = Object.values(changes).join("\n").split("\n").length > 50;

  const fdDiff = new FormData();
  if (!tooLarge)
    for (let i = 0; i < Object.keys(changes).length; i++) {
      const [name, content] = Object.entries(changes);

      fdDiff.append(
        `files[${i}]`,
        new Blob([content], { type: types.diff }),
        `${name}-${x}.diff`
      );
    }

  fdDiff.append(
    "payload_json",
    JSON.stringify({
      content: Object.keys(changes)[0]
        ? `Color changes for **${x}**${
            tooLarge
              ? `:\n\n${Object.entries(changes)
                  .map((y) => `\`${y[0]}-${x}.json\` \`\`\`diff\n${y[1]}\`\`\``)
                  .join("\n")}`
              : ""
          }`
        : `No color changes for **${x}**!`,
      username: user.name,
      avatar_url: user.avatar,
      allowed_mentions: {
        parse: [],
      },
    })
  );
  const responseDiff = await (
    await fetch(`${webhook}?${query.toString()}`, {
      method: "POST",
      body: fdDiff,
    })
  ).json();

  if (!responseDiff.id) {
    console.log(`Failed to send message 2 (${x})! ${JSON.stringify(response)}`);
    continue;
  }

  count++;
}

console.log(`Sent messages (${count})`);
