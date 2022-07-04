/* eslint-disable no-console */

import { exec } from '../lib/exec';
import { getConfig, getProfileSuffix } from '../lib';

export async function destroy(): Promise<void> {
  const config = await getConfig();
  const _profile = getProfileSuffix(config);

  console.log(`>>>
>>> Destroying '${config.branch}' branch
>>>\n\n`);

  try {
    await exec(`npx cdk destroy --all --force${_profile}`);
  } catch {
    process.exit(-1);
  }
}

if (require.main === module) {
  destroy();
}
