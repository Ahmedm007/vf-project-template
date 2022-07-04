import { exec } from '../../lib';
import * as packageJSON from '../../package.json';

// make sure connect-core runs first if present in packages folder
async function buildAll(): Promise<string[]> {
  return await new Promise(resolve => {
    resolve(packageJSON.workspaces.filter(workspace => workspace !== 'packages/cicd'));
  });
}

async function getChangedPackages(): Promise<string[]> {
  // check for commands sent from 'npm run codebuild'
  if (process.env.BUILD_PACKAGE_LIST === 'BUILD_ALL') {
    return buildAll();
  }
  if (process.env.BUILD_PACKAGE_LIST?.length) {
    return process.env.BUILD_PACKAGE_LIST.split(',').map(pkg => `packages/${pkg}`);
  }

  // catch edge case where its first run of codebuild
  if (process.env.CODEBUILD_WEBHOOK_PREV_COMMIT?.startsWith('000000000000')) {
    return buildAll();
  }

  // catch case where codebuild is invoked by something other than the webhook
  if (!process.env.CODEBUILD_WEBHOOK_PREV_COMMIT) {
    return buildAll();
  }

  // diff sha's to get files that changed and figure out what package they are in
  const list = await exec(
    `git diff --name-only ${process.env.CODEBUILD_RESOLVED_SOURCE_VERSION} ${process.env.CODEBUILD_WEBHOOK_PREV_COMMIT}`,
    false
  );
  const files = list.split('\n');
  const EXTRACT_PACKAGE_NAME = /^packages\/([-_0-9a-zA-Z]*)\//;

  // deduplicate packages
  const packageSet = new Set<string>();
  for (const file of files) {
    const results = EXTRACT_PACKAGE_NAME.exec(file);
    if (results) {
      packageSet.add(`packages/${results[1]}`);
    }
  }
  return Array.from(packageSet);
}

async function buildChangedPackages() {
  const changedPackages: string[] = await getChangedPackages();

  // the package.json workspaces section is an ordered list
  // filter it based on the changed packages
  const workspaces: string[] = packageJSON.workspaces.filter(a => changedPackages.includes(a));

  try {
    for (const workspace of workspaces) {
      // eslint-disable-next-line no-console
      console.log(`>>>\n>>>\n>>> Building ${workspace}\n>>>\n>>>`);
      await exec(`npm run build -w ${workspace} --if-present`);
      await exec(`npm run synth -w ${workspace}`);
      await exec(`npm run deploy -w ${workspace}`);
    }
  } catch {
    process.exit(1);
  }
}

if (require.main === module) {
  buildChangedPackages();
}
