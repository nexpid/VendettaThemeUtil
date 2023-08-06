import { readdir, readFile, copyFile, mkdir, rm } from "fs/promises";
import { join } from "path";

const rawVer = Number(process.argv[2]);
if (Number.isNaN(rawVer) || !process.argv[2])
  throw new Error("No version specified blehh");

const rev = rawVer.toString();
const ver = `${rev.slice(0, -3)}.${Number(rev.slice(-2))}`;

/** @type {{ name: string, dir: string, path: string }[]} */
const paths = [];

const recursive = async (dir, path) => {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.isDirectory())
      await recursive(join(dir, ent.name), [...path, ent.name]);
    else paths.push({ name: ent.name, dir, path });
  }
};

await recursive(join("tmp", "discordapk", "base"), ["base"]);
await recursive(join("tmp", "discordapk", "xxhdpi"), ["xxhdpi"]);

const lines = (await readFile("./tmp/decompiled.js", "utf8"))
  .split("\n")
  .map((x) => x.trim());

/** @type {{ icon: string, source: string, path: string[] }[]} */
const iconmap = [];

let notfound = 0;
for (let line = 0; line < lines.length; line++) {
  const ln = lines[line];

  const registerAssetMatch = /^r[0-9]+ = r[0-9]+\.registerAsset;$/;
  const assetDataMatch = /= ([^;]+);$/;
  const assetDataRaw = lines[line + 1]?.match(assetDataMatch);

  // asset data is usually the next line
  if (ln.match(registerAssetMatch) && assetDataRaw?.[1]) {
    const data = (0, eval)(`(${assetDataRaw[1]})`);

    const path = data.httpServerLocation.split("/").slice(2).join("_");
    if (["node_modules", "i18n"].some((x) => path.startsWith(x))) continue;

    const files = [
      `${data.name}.${data.type}`,
      `${data.name.replace(/[-@]/g, "")}.${data.type}`,
    ].map((file) => [path, file].join("_"));

    for (const file of files) {
      const flpath = paths.find((x) => x.name === file.toLowerCase());
      if (flpath) {
        iconmap.push({
          source: join(flpath.dir, flpath.name),
          icon: `${data.name}.${data.type}`,
          path: data.httpServerLocation.split("/").slice(2),
        });
        break;
      }
    }

    notfound++;
  }
}

console.log(`Got ${iconmap.length} icons (${notfound} not found)`);
console.log("Writing...");

const iconPaths = {
  ver: join("icons", ver),
  latest: join("icons", "latest"),
};

await rm(iconPaths.ver, { recursive: true, force: true });
await rm(iconPaths.latest, { recursive: true, force: true });

for (const x of iconmap) {
  const pathVer = join(iconPaths.ver, ...x.path);
  const pathLatest = join(iconPaths.latest, ...x.path);

  await mkdir(pathVer, { recursive: true });
  await mkdir(pathLatest, { recursive: true });

  await copyFile(x.source, join(pathVer, x.icon));
  await copyFile(x.source, join(pathLatest, x.icon));
}

console.log(`Wrote to icons/${ver}`);
console.log("Wrote to icons/latest");
