const fs = require('node:fs');
const fsPromise = require('node:fs/promises');
const path = require('path');

const cfg = {
  dir: 'styles',
  outDir: 'project-dist',
  outName: 'bundle',
  ext: 'css',
  EOL: '\n',
};

const src = path.join(__dirname, cfg.dir);
const dest = path.join(__dirname, cfg.outDir);

const make = async (srcDirPath, distDirPath, config) => {
  const { ext, EOL, outName: fileName } = config;

  const content = await fsPromise.readdir(srcDirPath, {
    withFileTypes: true,
  });

  const compiledData = content.reduce(async (acc, item) => {
    const isItemNotDir = !item.isDirectory();
    const isItemExtCorrect = path.extname(item.name) === `.${ext}`;
    const isItemCorrect = isItemNotDir && isItemExtCorrect;

    if (isItemCorrect) {
      const itemSrc = path.join(srcDirPath, item.name);
      const itemContent = new Promise((resolve, reject) => {
        let output = '';
        fs.createReadStream(itemSrc, {
          encoding: 'utf-8',
        })
          .on('data', (chunk) => (output += chunk))
          .on('end', () => resolve(output))
          .on('error', (err) => reject(err));
      });
      return (await acc) + (await itemContent) + EOL;
    }
    return acc;
  }, Promise.resolve(''));

  const distFullPath = path.join(distDirPath, `${fileName}.${ext}`);
  await fsPromise.writeFile(distFullPath, await compiledData, {
    encoding: 'utf-8',
  });
};

make(src, dest, cfg);
