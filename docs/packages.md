# Packages

## Working with Packages

The following scripts should be included in every `package.json` within each `packages/*` directory:

```json
  "scripts": {
    "clean": "rimraf node_modules dist",
    "synth": "ts-node ../../bin/synth",
    "synth:ci": "npx cdk synth",
    "deploy": "ts-node ../../bin/deploy",
    "deploy:ci": "npx cdk deploy --all --require-approval never",
    "destroy": "ts-node ../../bin/destroy"
  }
```

You will notice that the `synth/deploy/destroy` commands are looking up to the root directory and running scripts from the `bin/` folder.

If you want to work on one package during development, you can simply `cd` into the package you are working on and run these scripts locally instead of from the root.

**_IMPORTANT_**: Running `synth/deploy/destroy` from the root will by nature run those commands for all directories within `packages/*`.

---

## How to add a Package

This repo has examples of adding existing VF apps to your project (admin/voicemail) as well as creating your own CDK stack (connect-lambdas) for custom development.

In general, adding a package could be modelled off of one of the existing packages in the template.
Ensure that you create a new folder with the package name within `packages/` and it contains the following files:

```text
├── ...
    ├── packages
        ├── new-package                 # folder of the named package
            ├── src                     # for lambdas etc, if needed
                ├── ...
            ├── stacks                  # define local stacks here for infra.ts, if needed
                ├── ...
            ├── .eslintrc.js            # for adding/extending eslint rules from root
            ├── .prettierrc.js          # for adding/extending prettier rules from root
            ├── buildspec.yml           # for CodeBuild
            ├── cdk.json                # configs for cdk
            ├── infra.ts                # define CDK app here
            ├── package.json            # dependencies/local scripts
            └── tsconfig.json           # for adding/extending tsconfig rules from root
```

Once you have structured the new package and installed needed dependencies, make sure to export the StackProps needed into the `Configuration.ts` interface and apply the necessary props to the config files of the branches/stages you want to deploy to.
See [Configuration](./config.md) for more details.

---

## Buildspec.yml

```yml
#connect-core buildspec.yml
version: 0.2

phases:
  install:
    commands:
      - node --version
      - npm --version
      - npm install --no-scripts
      - cd packages/connect-core
      - npm install
  build:
    commands:
      - echo Build started on `date`
      - npm run synth
      - npm run deploy --all --require-approval never
  post_build:
    commands:
      - echo Build completed on `date`
```

The stack props are selected using using [`../lib/getConfig.ts`](../lib/getConfig.ts)

```typescript
  // ../lib/getConfig.ts
  const prodConfig = getConfigFromFile(PROD_CONFIG_FILENAME);

  //...

  // returns formatted config object with added properties from this file to the packages/*/infra.ts
  return {
    ...config,
    branch,
    stage,
    prefix,
    profile,
    connectInstanceId,
    env: {
      account: config.account.id,
      region: config.account.region
    }
  };
}
```

```typescript
// packages/connect-core/infra.ts
const app = new App();

async function buildInfra() {
  const config = await getConfig();
  const {
    prefix, profile, env, branch, repo, client, stage
  } = config;

  //...

  await GithubCodeBuild.create(app, `CICD${toPascal(stage)}`, {
    stackName: `${stagePrefix}-connect-core-cicd`,
    profile,
    env,
    projectName: `${client}-connect-core-${stage}`,
    branch,
    repo: repo.name,
    owner: repo.owner,
    githubCredentialsSecretARN: repo.oauthSecretARN,
    buildSpec: `packages/connect-core/buildspec.yml`,
    filePath: `packages/connect-core/*`,
    buildPolicyStatements: [
      new PolicyStatement({
        actions: ['connect:ListInstances', 'ds:DescribeDirectories'],
        resources: ['*']
      })
    ],
  });
}
```

## Sharing Constructs

If you need to share constructs between packages (ie. CTR buckets created from `connect-core`)... the easiest method would be to gather the resources AFTER the source stack has deployed and adding those properties into the config file. This way, the "new package" will have ARNs/existing resources to build off of when it deploys.
