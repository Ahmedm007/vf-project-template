/* eslint-disable no-console */

import { exec } from '../lib/exec';
import { getConfig, getProfileSuffix } from '../lib';

export async function deploy(): Promise<void> {
  const config = await getConfig();
  const _profile = getProfileSuffix(config);

  console.log(`>>>
>>> Synthesizing '${config.branch}' branch
>>>\n\n`);

  const stackName: string = process.env.STACK || '--all';
  try {
    await exec(`npx cdk deploy ${stackName} --require-approval never${_profile}`);
  } catch {
    process.exit(-1);
  }
}

if (require.main === module) {
  deploy();
}
