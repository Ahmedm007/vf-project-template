import { resolve } from 'path';
import { exec, getAWSAccounts, getLocalGitBranch, ROOT_DIR } from '../lib';
import { CloudFormation, config, SharedIniFileCredentials } from 'aws-sdk';
import { runCodeBuild } from './runCodeBuild';
import { installPackFiles } from '../lib/packUtils';

const CICD_DIRECTORY = resolve(__dirname, '..', 'packages', 'cicd');

async function checkReadyState() {
  const branch = await getLocalGitBranch();
  if (!(branch === 'master' || branch === 'main')) {
    throw new Error('must be on master/main branch to bootstrap repo');
  }
  const response = await exec('git status -s', false);
  if (response.length) {
    throw new Error('git status must be clean to run bootstrap command. commit changes and rerun bootstrap');
  }
}

async function commitPackageLocks() {
  await exec('git restore --staged .');
  await exec(`git add ${ROOT_DIR}/package-lock.json`);
  await exec(`[[ \`git status --porcelain\` ]] && git commit -m "committing package-lock file" || exit 0`);
  await exec(`git push`);
}

async function cdkBootstrap({ id, region, profile }: { id: string; region: string; profile: string }) {
  if (profile) {
    config.credentials = new SharedIniFileCredentials({ profile });
  }
  const cloudFormation = new CloudFormation({ region });
  try {
    await cloudFormation.describeStacks({ StackName: 'CDKToolkit' }).promise();
  } catch {
    // eslint-disable-next-line no-console
    console.log(`
>>>
>>> CDK Bootstrapping for AWS Account: ${id} / ${region}
>>> Using profile ${profile}
>>>`);
    await exec(`CDK_NEW_BOOTSTRAP=1 npx cdk bootstrap aws://${id}/${region} --profile ${profile}`);
  }
}

export async function bootstrap(): Promise<void> {
  await checkReadyState();
  await installPackFiles();
  await commitPackageLocks();

  for (const { id, region, profile, branch } of getAWSAccounts()) {
    await cdkBootstrap({ id, region, profile });

    if (branch === 'default') {
      continue;
    }

    await exec(`cd ${CICD_DIRECTORY} && BRANCH=${branch} npm run synth && BRANCH=${branch} npm run deploy`);
    await runCodeBuild([branch]);
  }
}

if (require.main === module) {
  bootstrap();
}
