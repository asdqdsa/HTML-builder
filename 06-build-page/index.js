const fsPromise = require('node:fs/promises');
const path = require('path');
const fs = require('node:fs');

const cfg = {
  srcStylesDir: 'styles',
  outStylesDir: 'styles',
  srcComponentsDir: 'components',
  srcAssetsDir: 'assets',
  srcTemplate: 'template',
  srcTemplateDir: '.',
  outDir: 'project-dist',
  outIndex: 'index.html',
  outStyle: 'style',
  public: 'assets',
  extStyle: 'css',
  extMarkup: 'html',
  EOL: '\n',
  DIRNAME: __dirname,
};

// copy assets
async function mvAssest(srcDir, destDir) {
  await fsPromise.rm(destDir, { recursive: true, force: true });

  await fsPromise.mkdir(destDir, { recursive: true });
  const content = await fsPromise.readdir(srcDir, { withFileTypes: true });

  for (const item of content) {
    const srcPathItem = path.join(srcDir, item.name);
    const destPathItem = path.join(destDir, item.name);
    const isItemDir = item.isDirectory();

    if (isItemDir) await mvAssest(srcPathItem, destPathItem);
    else await fsPromise.copyFile(srcPathItem, destPathItem);
  }
}

// bundle styles
async function mkStyles(srcDirPath, distDirPath, config) {
  const { extStyle: ext, EOL, outStyle: fileName } = config;

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
  const isDestDirExist = await checkDirExist(distFullPath);
  if (!isDestDirExist) {
    const outStylesDirFull = path.join(distDirPath);
    await fsPromise.mkdir(outStylesDirFull, { recursive: true });
  }
  await fsPromise.writeFile(distFullPath, await compiledData, {
    encoding: 'utf-8',
  });
}

// util
async function checkDirExist(path) {
  try {
    await fsPromise.access(path);
    return true;
  } catch {
    return false;
  }
}

// compile markup
async function mkMarkup(entryDir, destDir, componentsDir, config) {
  const {
    EOL,
    srcTemplate: templateName,
    outIndex: fileName,
    extMarkup: ext,
  } = config;

  const templateFullPath = path.join(entryDir, `${templateName}.${ext}`);
  const destFullPath = path.join(destDir, fileName);
  const isDestDirExist = await checkDirExist(destFullPath);
  if (!isDestDirExist) {
    const outDirFull = path.join(destDir);
    await fsPromise.mkdir(outDirFull, { recursive: true });
  }

  const templateContent = await new Promise((resolve, reject) => {
    let output = '';
    fs.createReadStream(templateFullPath, {
      encoding: 'utf-8',
    })
      .on('data', (chunk) => (output += chunk))
      .on('end', () => resolve(output))
      .on('error', (err) => reject(err));
  });

  const componentsList = await fsPromise.readdir(componentsDir, {
    withFileTypes: true,
  });

  let indexContent = templateContent;
  for (const dirent of componentsList) {
    const isEntryNotDir = !dirent.isDirectory();
    const isEntryExtCorrect = path.extname(dirent.name) === `.${ext}`;
    const isComponentCorrect = isEntryNotDir && isEntryExtCorrect;

    if (isComponentCorrect) {
      const componentContent = await new Promise((resolve, reject) => {
        let output = '';
        const componentFullPath = path.join(componentsDir, dirent.name);
        fs.createReadStream(componentFullPath, {
          encoding: 'utf-8',
        })
          .on('data', (chunk) => (output += chunk))
          .on('end', () => resolve(output))
          .on('error', (err) => reject(err));
      });
      const placeholder = `{{${dirent.name.split('.')[0]}}}`;
      indexContent = indexContent.replaceAll(
        placeholder,
        EOL + componentContent + EOL,
      );
    }
  }

  await fsPromise.writeFile(destFullPath, await indexContent, {
    encoding: 'utf-8',
  });
}

// main
async function buildHTML(config) {
  // compile styles
  const srcStyle = path.join(config.DIRNAME, config.srcStylesDir);
  const destStyle = path.join(config.DIRNAME, config.outDir);
  mkStyles(srcStyle, destStyle, config);

  // move assets
  const srcAssest = path.join(config.DIRNAME, config.srcAssetsDir);
  const destAssest = path.join(config.DIRNAME, config.outDir, config.public);
  mvAssest(srcAssest, destAssest);

  // compile index
  const srcTemplateDir = path.join(config.DIRNAME, config.srcTemplateDir);
  const destDir = path.join(config.DIRNAME, config.outDir);
  const srcComponentsDir = path.join(config.DIRNAME, config.srcComponentsDir);
  mkMarkup(srcTemplateDir, destDir, srcComponentsDir, config);
}

buildHTML(cfg);
