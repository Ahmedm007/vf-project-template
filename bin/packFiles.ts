/* eslint-disable no-console */
import { installPackFiles, resetPackFiles } from '../lib/packUtils';

async function main() {
  let cmd = 'install';

  if (process.argv.length === 3 && process.argv[2]) {
    cmd = process.argv[2];
  }

  switch (cmd) {
    case 'reset':
      console.log('Resetting pack file configuration');
      await resetPackFiles();
      break;
    default:
      console.log('Configuring pack files');
      installPackFiles();
  }
}

if (require.main === module) {
  main();
}
