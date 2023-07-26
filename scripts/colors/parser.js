/**
 * @@@@@@@@@@@@@@@@@@@@@@@@@@
 *
 *     💀💀 DANGER 💀💀
 *
 * @@@@@@@@@@@@@@@@@@@@@@@@@@
 *
 * this code is extremely unreliable, buggy and messy!! don't use it!! ever!!
 */

import { readFile } from "fs/promises";
import { cwrite } from "./writer.js";

const rawVer = Number(process.argv[2]);
if (Number.isNaN(rawVer) || !process.argv[2])
  throw new Error("No version specified blehh");

const rev = rawVer.toString();
const ver = `${rev.slice(0, -3)}.${Number(rev.slice(-2))}`;

const lines = (await readFile("./tmp/decompiled.js", "utf8"))
  .split("\n")
  .map((x) => x.trim());

const lookForDefinition = (vrb, before = lines.length) => {
  for (let i = before; i >= 0; i--) {
    const mat = lines[i].match(new RegExp(`${vrb} = `));
    if (mat?.[0]) return lines[i];
  }
};

const semHook = /r[0-9]+\['SemanticColors'\] = (r[0-9]+)/;

const semHookLine = lines.findIndex((x) => x.match(semHook)?.[1]);
if (!semHookLine) throw new Error("Failed to find semHookLine!");

const semHookVar = lines[semHookLine].match(semHook)[1];

let semStartLine = semHookLine;
for (; semStartLine >= 0; semStartLine--) {
  if (lines[semStartLine - 1].startsWith(`${semHookVar} = {}`)) break;
}

const semanticColors = {};
for (let i = semStartLine; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith(`${semHookVar}['`)) {
    const [_, key, vrb] = l.match(
      new RegExp(`^${semHookVar}\\['(.*?(?='))'\\] = (r[0-9]+)`)
    );
    const matcher = new RegExp(`\\(${vrb}, (r[0-9]+), (r[0-9]+)\\)`);
    const definitions = {};
    for (let line = i; line >= 0; line--) {
      const ln = lines[line];
      if (!ln.includes(vrb)) continue;
      const thingy = ln.match(matcher);

      if (ln.startsWith(`${vrb} =`)) break;
      else if (thingy?.[1]) {
        const dumLn = lookForDefinition(thingy[2], line - 1);
        const dum = dumLn?.match(/= (.*(?=;))/)?.[1];
        if (!dum)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no dum (${dumLn}, ln ${lines.findIndex(
              (x) => x === dumLn
            )})`
          );
        const whatisitLn = lookForDefinition(thingy[1], line - 1);
        const whatisit = whatisitLn
          ?.match(/= r[0-9]+\.(.*(?=;))/)?.[1]
          ?.toLowerCase();
        if (!whatisit)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no whatisit (${whatisitLn}, ln ${lines.findIndex(
              (x) => x === whatisitLn
            )})`
          );

        definitions[whatisit] = eval(`(${dum})`);
      }
    }

    semanticColors[key] = definitions;
  } else break;
}

const rawHook = /r[0-9+]\['RawColors'\] = (r[0-9]+)/;
const rawHookLine = lines.findIndex((x) => x.match(rawHook)?.[1]);
if (!rawHookLine) throw new Error("Failed to find rawHookLine!");

const rawHookVar = lines[rawHookLine].match(rawHook)[1];

const rawObj = lookForDefinition(rawHookVar, rawHookLine)?.match(
  /= (.*(?=;))/
)?.[1];
if (!rawObj) throw new Error("RAW: no rawObj!!!");

const rawColors = eval(`(${rawObj})`);

cwrite(ver, semanticColors, rawColors);
