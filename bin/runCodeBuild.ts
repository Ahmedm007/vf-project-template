import { resolve } from 'path';
import { readdirSync } from 'fs';
import { SharedIniFileCredentials, CodeBuild } from 'aws-sdk';
import { getConfig, getPackageNames } from '../lib';

function getNamedConfigs() {
  const CONFIG_DIRECTORY = resolve(__dirname, '..', 'config');
  const configFiles = readdirSync(CONFIG_DIRECTORY);

  const namedConfigs: string[] = [];
  for (const configFile of configFiles) {
    if (configFile.endsWith('.config.ts') && !configFile.startsWith('default')) {
      namedConfigs.push(configFile.split('.')[0]);
    }
  }
  return namedConfigs;
}

export async function runCodeBuild(commandArgs: string[] = []) {
  const packageNames = await getPackageNames();
  const namedConfigs = getNamedConfigs();

  const packages: string[] = [];
  let branch: string | undefined;
  for (const arg of commandArgs) {
    if (packageNames.indexOf(arg) !== -1) {
      if (arg === 'cicd') {
        throw new Error('cicd cannot be deployed with CodeBuild. cd into that directory and deploy locally');
      }
      packages.push(arg);
    } else if (namedConfigs.indexOf(arg) !== -1) {
      if (branch) {
        throw new Error(`cannot deploy both ${arg} and ${branch} stages at once`);
      }
      branch = arg;
    } else {
      throw new Error(`${arg} is not a package name or a branch with a branch.config.ts and thus cicd deployed`);
    }
  }

  const envOverrideValue = packages.length ? packages.join(',') : 'BUILD_ALL';

  const {
    prefix,
    profile,
    env: { region }
  } = await getConfig(branch);
  const credentials = new SharedIniFileCredentials({ profile });
  const codeBuild = new CodeBuild({ credentials, region });
  await codeBuild
    .startBuild({
      projectName: prefix,
      environmentVariablesOverride: [{ type: 'PLAINTEXT', name: 'BUILD_PACKAGE_LIST', value: envOverrideValue }]
    })
    .promise();
}

if (require.main === module) {
  const [, , ...commandArgs] = process.argv;
  runCodeBuild(commandArgs);
}
