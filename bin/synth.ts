/* eslint-disable no-console */

import { exec, getConfig, getProfileSuffix } from '../lib';

export async function synth(): Promise<void> {
  const config = await getConfig();
  const _profile = getProfileSuffix(config);

  console.log(`>>>
>>> Synthesizing '${config.branch}' branch
>>>\n\n`);

  try {
    await exec(`npx cdk synth${_profile}`);
  } catch {
    process.exit(-1);
  }
}

if (require.main === module) {
  synth();
}
