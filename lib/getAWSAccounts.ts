import * as fs from 'fs';
import { resolve } from 'path';
import { Configuration } from '../config/Configuration';

export function getAWSAccounts(): { id: string; region: string; profile: string; branch: string }[] {
  const CONFIG_DIRECTORY = resolve(__dirname, '..', 'config');
  const configFiles = fs.readdirSync(CONFIG_DIRECTORY);
  const accountIds = [];

  for (const configFile of configFiles) {
    if (configFile.endsWith('.config.ts')) {
      const branch = configFile.replace('.config.ts', '');
      const filepath = resolve(CONFIG_DIRECTORY, configFile);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const configBody = require(filepath);
      const config: Configuration = configBody.default;

      const { id, region, profile } = config.account;
      if (!(id && region && profile)) {
        throw new Error(
          'missing account id/region/profile in config file. Make sure all config files have valid account id filled out'
        );
      }
      accountIds.push({ id, region, profile, branch });
    }
  }
  return accountIds;
}
