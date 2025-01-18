const { error } = require('node:console');
const fsPromise = require('node:fs/promises');
const path = require('path');

const cfg = {
  dir: 'secret-folder',
  EOL: '\n',
};

const src = path.join(__dirname, cfg.dir);

fsPromise
  .readdir(src, {
    withFileTypes: true,
  })
  .then((dirent) => {
    const contentPromise = dirent.map(async (val) => {
      const fileName = val.name.split('.')[0];
      // const fileExtension = val.name.split('.')[1];
      const fileExtension = path.extname(val.name).slice(1);
      const fullPath = path.join(src, val.name);
      const stats = await fsPromise.stat(fullPath);
      const fileSize = (stats.size / 1024).toFixed(3);

      if (!val.isDirectory()) {
        process.stdout.write(
          // <file name>-<file extension>-<file size>
          `${fileName}-${fileExtension}-${fileSize}kB` + cfg.EOL,
        );
      }
    });
    return Promise.all(contentPromise);
  });
