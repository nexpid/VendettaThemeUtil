import { writeFile, readFile } from "fs/promises";

const rawVer = Number(process.argv[2]);
if (Number.isNaN(rawVer) || !process.argv[2])
  throw new Error("No version specified blehh");

const rev = rawVer.toString();
const ver = `${rev.slice(0, -3)}.${Number(rev.slice(-2))}`;

const content = await readFile("./tmp/decompiled.js");
await writeFile("decompiled/latest.js", content);
console.log(`Wrote to decompiled/latest.js`);

await writeFile(`decompiled/${ver}.js`, content);
console.log(`Wrote to decompiled/${ver}.js`);
