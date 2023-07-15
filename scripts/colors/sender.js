import { join } from "path";
import getchanges, { only } from "../getchanges.js";
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
const thread = "1129770152112697424";

const folders = only(getchanges())
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
    const guh = file.split(".");

    const ext = guh.slice(-1)[0];
    const name = guh.slice(0, -1).join(".");

    const contentType = types[ext];
    const content = await readFile(join("../colors", x, file));

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

  if (response.id) {
    lastMessage = response.id;
    count++;
  } else
    console.log(`Failed to send message (${x})! ${JSON.stringify(response)}`);
}

console.log(`Sent messages (${count})`);
