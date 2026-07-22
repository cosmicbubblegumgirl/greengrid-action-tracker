import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

let writeQueue = Promise.resolve();

export async function readDatabase(filePath, createSeedState) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const seeded = createSeedState();
    await writeDatabase(filePath, seeded);
    return seeded;
  }
}

export function updateDatabase(filePath, createSeedState, updater) {
  const operation = writeQueue.catch(() => undefined).then(async () => {
    const current = await readDatabase(filePath, createSeedState);
    const result = await updater(current);
    await writeDatabase(filePath, current);
    return result;
  });

  writeQueue = operation.catch(() => undefined);
  return operation;
}

async function writeDatabase(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}
