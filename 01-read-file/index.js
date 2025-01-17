const fs = require('node:fs');
const path = require('path');

const cfg = {
  filename: 'text.txt',
  EOL: '\n',
};

const src = path.join(__dirname, cfg.filename);

const readStream = fs.createReadStream(src, 'utf-8');
readStream.on('data', (chunk) => {
  process.stdout.write(chunk + cfg.EOL);
});
