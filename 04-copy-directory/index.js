const fsPromise = require('node:fs/promises');
const path = require('path');

const cfg = {
  dir: 'files',
  outDir: 'files-copy',
};

const src = path.join(__dirname, cfg.dir);
const dest = path.join(__dirname, cfg.outDir);

const copyDir = async (srcDir, destDir) => {
  await fsPromise.rm(destDir, { recursive: true, force: true });
  await fsPromise.mkdir(destDir, { recursive: true });
  const content = await fsPromise.readdir(srcDir, { withFileTypes: true });

  for (const item of content) {
    const srcPathItem = path.join(srcDir, item.name);
    const destPathItem = path.join(destDir, item.name);
    const isItemDir = item.isDirectory();

    if (isItemDir) await copyDir(srcPathItem, destPathItem);
    else await fsPromise.copyFile(srcPathItem, destPathItem);
  }
};

copyDir(src, dest);
