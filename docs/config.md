# Configs

## System Configuration and `Configuration.ts`

Configuration files are stored in `/configs`. These configs are designed to be a central place where all packages can derive their configurations (ie. extending these for admin app/voicemail app configs) as needed.

The system is based around the git branch and uses branch-based development. So anytime one runs `npm run synth/deploy`, the scripts will run `git status` under the hood to figure out what branch is currently active and use the correct environment variables.

The names of the files map 1-1 with branch names. Ie if your environments are `dev/test/prod` and those environments match with code on the `dev/test/main` branches you will need `dev.config.ts`, `test.config.ts` and `main.config.ts`. The only situation where the branch will not match 1-1 with the environment name is on prod/main as there are some repo's still using `master` as the primary branch. In this case the config file must be `main.config.ts`. Note how the name of the file is the same as the branch name.

There is also a `default.config.ts` file that is used as a fallback if no other config file is found. This is the "team" development environment. This can be either the team account or the client dev account (or wherever you would like "development" to be deployed to). As an example if one is working on the `feature-123` branch and there is no `feature-123.config.ts` file, the `default.config.ts` file will be used.

You will notice, throughout the repo, there are calls to `lib/getConfig.ts` to return the appropriate config file for the branch one is working on (See [`lib/getConfig.ts`](../lib/getConfig.ts) for implementation). It is possible to override the "active" branch by passing in the branch name when calling that function from TS or by setting the `BRANCH` environment variable from the command line.

```typescript
const config = getConfig('main');
```

```bash
BRANCH=main npm run synth
```

## Required Configs

There are two configs that are necessary for the repo to function properly. One is the `default.config.ts`.

The other is `[main/master].config.ts`. Main/Master are interchangeable and the getConfig function will look for either in the folder (as a not you may not have both `master.config.ts` and `main.config.ts`).

## Example configuration file

In the `Configuration.ts` file, you will notice that the `AdminStackProps` and `VoiceMailProps` are imported and optionally added to the `RepoConfig` interface. This allows for flexibility with versioning between these apps.

As you add modular packages, you can extend the configuration by importing the stack props to the Configuration interface as an optional parameter (see commented out import and props). In this example, we are using `Omit` to ignore any properties that will already be defined in the configuration files (like "client", "env" etc) to not have to add duplicate values in a config. You can reinsert them into the constructs within the packages'`infra.ts`. See the voicemail or admin app `infra.ts` for an example.

```typescript
import { AdminStackProps } from '../packages/admin/node_modules/@ttec-dig-vf/vf-connect-admin';
import { VoiceMailProps } from '../packages/voicemail/node_modules/@ttec-dig-vf/connect-voicemail';
import { ConnectLambdasProps } from '../packages/connect-resources/stacks/ConnectLambdas';
/**
 * Add your new props import here like so:
 */
import { NewPackageProps } from '../packages/new-package/node_modules/@ttec-dig-vf/new-package';

export interface Configuration {
  client: string;
  project: string;
  account: Account;
  repo: RepoConfig;
  connectCore?: Omit<ConnectCoreProps, 'prefix' | 'env'>;
  connectLambdas?: Omit<ConnectLambdasProps, 'client' | 'stage' | 'prefix' | 'connectInstanceId' | 'env'>;
  admin?: Omit<AdminStackProps, 'client' | 'stage' | 'connectInstanceId' | 'assets'>;
  voicemail?: Omit<VoiceMailProps, 'client' | 'stage' | 'project' | 'connectInstanceId' | 'env'>;
  /**
   * Add your new props to the Configuration interface like this:
   */
  newPackageProps?: Omit(<NewPackageProps, 'client' | 'stage' | 'project' | 'env'>)
}
```

To start configuring your apps, refer to the `Configuration.ts` file for type definitions that each package requires. Build your `*.config.ts` file within this folder with all the settings you want for the Connect Instance and each app you need.

Once all the proper configurations are supplied and the `connect-core` stack is deployed, the other apps will infer things like the `connectInstanceId` from using CloudFormation ImportValue.

## CICD and configurations

The repo uses branch based deployment and currently supports CICD pipelines with pushes to branch names in Github that match the name of your config file you are trying to deploy to (ie. pushing to `test` should have a matching `test.config.ts` file). If a stage is not matched, meaning one is working on a feature branch, the stack(s) will be configured from the `default.config.ts` file, with the branch name being whatever was specified from git. It is advised you also have that config file setup for testing/development.
