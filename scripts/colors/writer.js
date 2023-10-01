import { format } from "prettier";
import { existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function cwrite(version, semantic, raw) {
  const files = {
    RawColors: await format(JSON.stringify(raw), {
      parser: "json",
    }),
    SemanticColors: await format(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(semantic).map(([x, y]) => [
            x,
            {
              source: Object.fromEntries(
                Object.entries(y).map((x) => [x[0], x[1].raw])
              ),
              colors: Object.fromEntries(
                Object.entries(y).map((x) => {
                  const alpha = Math.floor(x[1].opacity * 0xff).toString(16);
                  return [
                    x[0],
                    `${raw[x[1].raw]}${alpha !== "ff" ? alpha : ""}`,
                  ];
                })
              ),
            },
          ])
        )
      ),
      { parser: "json" }
    ),
  };

  const writeTo = async (dir) => {
    const pat = join("colors", dir);
    if (!existsSync(pat)) await mkdir(pat);

    // replaces \n to \r\n for debug purposes
    for (const [x, y] of Object.entries(files))
      await writeFile(join(pat, `${x}.json`), y.replace(/\n/g, "\r\n"));

    console.log(`Wrote to colors/${dir}`);
  };

  await writeTo("latest");
  await writeTo(version);
}
