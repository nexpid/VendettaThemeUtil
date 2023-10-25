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

const worker = process.argv[3] === "action";

const rawVer = Number(process.argv[2]);
if (Number.isNaN(rawVer) || !process.argv[2])
  throw new Error("No version specified blehh");

const rev = rawVer.toString();
const ver = `${rev.slice(0, -3)}.${Number(rev.slice(-2))}`;

const lines = (
  await readFile(`${worker ? "./.." : "."}/tmp/decompiled.js`, "utf8")
)
  .split("\n")
  .map((x) => x.trim());

const lookForDefinition = (vrb, before = lines.length, useLine) => {
  for (let i = before; i >= 0; i--) {
    const mat = lines[i].match(new RegExp(`${vrb} = `));
    if (mat?.[0]) return useLine ? i : lines[i];
  }
};

const semHook = /r[0-9]+\['SemanticColors'\] = (r[0-9]+)/;
const rootHook = /(r[0-9]+)\[/;

const semHookLine = lines.findIndex((x) => x.match(semHook)?.[1]);
if (!semHookLine) throw new Error("Failed to find semHookLine!");

const semHookVar = lines[semHookLine].match(semHook)[1];
const semHookVarLine = lookForDefinition(semHookVar, semHookLine, true);
if (!semHookVarLine) throw new Error("Failed to find semHookVarLine!");

const rootHookVar = lines[semHookLine].match(rootHook)[1];
const rootHookVarLine = lookForDefinition(rootHookVar, semHookLine, true);
if (!rootHookVarLine) throw new Error("Failed to find colorVarLine!");

const semanticColors = {};
for (let i = semHookVarLine; i < semHookLine; i++) {
  const l = lines[i];
  if (l.startsWith(`${semHookVar}['`)) {
    let [_, key, vrb] = l.match(
      new RegExp(`^${semHookVar}\\['([^']+)'\\] = (r[0-9]+)`)
    );

    // variable definiton fix (for ACTIVITY_CARD_BACKGROUND)
    const vrbHook = new RegExp(`^${vrb} = (r[0-9]+)`);
    const vrbDef = lookForDefinition(vrb, i);
    const altVrb = vrbDef.match(vrbHook)?.[1] ?? vrb;

    const definitionMatcher = new RegExp(
      `(r[0-9]+) = r[0-9]+\\.bind\\(r[0-9]+\\)\\(${vrb}`
    );
    const shadeMatch = /= r[0-9]+\.([A-Z]*(?=;))/;
    const definitions = {};

    for (let line = i; line >= 0; line--) {
      const ln = lines[line];
      if (!ln.includes(vrb)) continue;
      const [_, clrVrb] = ln.match(definitionMatcher) ?? [];

      if (ln.startsWith(`${altVrb} =`)) break;
      else if (clrVrb) {
        const clrLnI = lookForDefinition(clrVrb, line - 1, true);
        const clrLn = lines[clrLnI];
        const clr = clrLn?.match(/= ([^;]+);$/)?.[1];
        if (!clr)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no clr ("${clrLn}", ln ${clrLnI + 1})`
          );

        let shade;
        for (
          let shadeLine = clrLnI - 1;
          shadeLine >= 0 && !shade;
          shadeLine--
        ) {
          const shdLn = lines[shadeLine];
          if (shdLn.match(shadeMatch)?.[1])
            shade = shdLn.match(shadeMatch)[1].toLowerCase();
        }
        if (!shade)
          throw new Error(
            `SEMANTIC: ${key} (${vrb}): no shade for ${key} (clr ${clr}, ln ${
              clrLnI + 1
            })`
          );

        definitions[shade] = (0, eval)(`(${clr})`);
      }
    }

    semanticColors[key] = definitions;
  }
}

const rawHook = new RegExp(`${rootHookVar}\\['RawColors'\\] = (r[0-9]+)`);
const rawHookLine = lines.findIndex((x) => x.match(rawHook)?.[1]);
if (!rawHookLine) throw new Error("Failed to find rawHookLine!");

const rawHookVar = lines[rawHookLine].match(rawHook)[1];

const rawObj = lookForDefinition(rawHookVar, rawHookLine)?.match(
  /= (.*(?=;))/
)?.[1];
if (!rawObj) throw new Error("RAW: no rawObj!!!");

const rawColors = (0, eval)(`(${rawObj})`);

cwrite(ver, semanticColors, rawColors);
