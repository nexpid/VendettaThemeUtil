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

const semHook = "r1['SemanticColors'] = r5";
const semHookLine = lines.findIndex((x) => x.startsWith(semHook));
if (!semHookLine) throw new Error("Failed to find semHookLine!");

let semStartLine = semHookLine;
for (; semStartLine >= 0; semStartLine--) {
  if (lines[semStartLine - 1].startsWith("r5 = {}")) break;
}

const semanticColors = {};
for (let i = semStartLine; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith("r5['")) {
    const [_, key, vrb] = l.match(/^r5\['(.*?(?='))'\] = (.*(?=;))/);
    const matcher = new RegExp(`\\b${vrb}\\b`);
    const definitions = {};
    for (let line = i; line >= 0; line--) {
      const ln = lines[line];
      if (!matcher.test(ln)) continue;

      if (ln.startsWith(`${vrb} =`)) break;
      else if (ln.includes(".bind(r0)")) {
        const whatisit = lines[line - 2]
          .match(/r[0-9]+ = r5\.(.*(?=;))/)?.[1]
          ?.toLowerCase();
        if (!whatisit)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no whatisit (${lines[line - 2]}, ln ${
              line - 2
            })`
          );
        const dum = lines[line - 1].match(/r[0-9]+ = (.*(?=;))/)?.[1];
        if (!dum)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no dum (${lines[line - 1]}, ln ${
              line - 1
            })`
          );

        definitions[whatisit] = eval(`(${dum})`);
      }
    }

    semanticColors[key] = definitions;
  } else break;
}

const rawHook = "r1['RawColors'] = r5";
const rawHookLine = lines.findIndex((x) => x.startsWith(rawHook));
if (!rawHookLine) throw new Error("Failed to find rawHookLine!");

const rawObj = lines[rawHookLine - 1].match(/^r5 = (.*(?=;))/)?.[1];
if (!rawObj) throw new Error("RAW: no rawObj!!!");

const rawColors = eval(`(${rawObj})`);

cwrite(ver, semanticColors, rawColors);
