import { join } from "path";
import getchanges from "../getchanges.js";
import { readFile, readdir } from "fs/promises";

const user = {
  name: "GitHub Actions",
  avatar:
    "https://cdn.discordapp.com/avatars/1033527398345482294/df91181b3f1cf0ef1592fbe18e0962d7.png",
};
const types = {
  json: "application/json",
};

const webhook = process.argv.slice(2).join(" ");
const thread = undefined;

const folders = getchanges()
  .filter((x) => ["A", "??"].includes(x[0]))
  .map((x) => x[1]);

let count = 0;
let lastMessage;
for (const x of folders) {
  const files = await readdir(join("../colors", x));
  console.log(
    `Sending ${x} — ${files.join(", ")}${
      lastMessage ? ` (followup to ${lastMessage})` : ""
    }`
  );

  const query = new URLSearchParams();
  query.append("wait", "true");
  if (thread) query.append("thread_id", thread);

  const fd = new FormData();
  for (const i in files) {
    const file = files[i];
    const contentType = types[file.split(".").slice(-1)[0]];
    const content = await readFile(join("../colors", x, file));

    fd.append(`files[${i}]`, new Blob([content], { type: contentType }), file);
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

  if (response.id) lastMessage = response.id;
  else count++;
}

console.log(`Sent messages (${count})`);
