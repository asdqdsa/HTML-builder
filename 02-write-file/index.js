const fs = require('node:fs');
const path = require('path');

const cfg = {
  filename: 'out',
  greetingText: 'Reading..',
  promtText: 'input: ',
  farewellText: 'Exiting..',
  EOL: '\n',
};

const src = path.join(__dirname, cfg.filename);
const writeStream = fs.createWriteStream(src, {
  encoding: 'utf-8',
  flags: 'a',
});

process.stdout.write(cfg.greetingText + cfg.EOL + cfg.promtText);

const handleExitSIGIN = (onSIGINT) => {
  writeStream.end();
  if (onSIGINT) process.stdout.write(cfg.EOL + cfg.farewellText + cfg.EOL);
  else process.stdout.write(cfg.farewellText + cfg.EOL);
  writeStream.on('finish', () => process.exit());
};

process.stdin.on('data', (input) => {
  const userInput = input.toString().trim();
  if (userInput !== 'exit') {
    process.stdout.write(cfg.promtText);
    writeStream.write(input);
  } else {
    handleExitSIGIN(false);
  }
});

process.on('SIGINT', () => {
  handleExitSIGIN(true);
});
