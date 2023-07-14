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
                Object.entries(y).map((x) => [x[0], raw[x[1].raw]])
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
    for (const [x, y] of Object.entries(files))
      await writeFile(join(pat, `${x}.json`), y);
    console.log(`Wrote to colors/${dir}`);
  };

  await writeTo("latest");
  await writeTo(version);
}
