# Description

In an effort to ease your journey with this repo we have setup some conventions that will help. It is setup for branch based development and use with multiple AWS accounts. It is also equipped to allow for a separate environment for consultant development.

> Check out the [Devika Anil's Tutorial](https://voicefoundry-cloud.atlassian.net/wiki/spaces/VFDocumentation/pages/2365587460/VF+Project+Template+Tutorial) for a step-by-step guide.

---

## Table of Contents

- [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Bootstrapping](#bootstrapping)
  - [Directory Layout](#directory-layout)
  - [Deployment](#deployment)
  - [Private Dependencies](#private-dependencies)
    - [Upgrading](#upgrading)
  - [Unit / Integration testing](#unit--integration-testing)
  - [Important things to know](#important-things-to-know)

Other READMEs

- [Configuration](config/00-README.md)
- [Packages](packages/README.md)
- [Integrating vf-deploy](docs/vf-deploy.md)

---

## Bootstrapping

To start, make sure to have a [Github Public Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) is generated and stored in Secrets Manager in each account.
The following permissions are needed for the token:

```text
repo
  repo:status
  repo_deployment
  public_repo
  repo:invite
  security_events

write:packages
  read:packages

admin:repo_hook
  write:repo_hook
  read:repo_hook
```

When storing in Secrets Manager, set the token as a plaintext value for Github. If using Bitbucket, it will need to be a key/value pair of username/password.

The name you choose for this secret will be the `oauthSecretName` that must be set in the config file.

Ensure all config files are properly set up for all the apps you plan on deploying to each AWS environment.
[Click here](config/00-README.md) to learn about Configuration

Make sure all dependencies are installed.
You can run `npm i` from the root and there is a postinstall script that will handle installing dependencies in all the apps in the `packages/*` folder.

After all configs are set up, you can run from the root directory:

```bash
npm run bootstrap
```

This will:

- Bootstrap all AWS environments with CDK (if not done already)
- `npm pack` all `@ttec-dig-vf` dependencies into the `./packs` folder and perform a local install
- Synth and deploy `connect-core`
- Synth and deploy all other apps in `packages/*`

From this point forward, further deployment will be handled by the CI/CD pipeline with Github webhooks and CodeBuild. See [Deployment](#deployment).

---

## Directory Layout

This repo is adopting a **Monorepo architechure**, utilizing compartmentalized "packages" that can be deployed from one repo. There are some benefits to utilizing a monorepo architechture. Depending on the need, you can add/remove packages for your project.
This allows for modular CDK apps on a per client basis, instead of one central CDK app that has multiple stacks for each app.

For example, if you have a client that does not need voicemail, you can simply delete the voicemail folder within the packages directory and remove the `VoicemailStackProps` from the [Configuration.ts](config/Configuration.ts) interface.

```text
    ├── bin                               # scripts run by all packages, publishing to CA
    ├── config                            # Config files for branch-based deployment setup here
        ├── Configuration.ts              # Interface definition for config files
        ├── *.config.ts                   # Config file where * === branch (dev/test/prod)
    ├── lib                               # shared scripts/helper functions
    ├── packages                          # Modularized CDK apps live here
        ├── admin
            ├── infra.ts                  # CDK stack defined here
            ├── package.json
            ├── ...                       # other configs (cdk.json, tsconfig.json, etc)
        ├── cicd
            ├── buildspec.yml             # buildspec for cicd pipelines
            ├── buildChangedPackages.ts   # script to determine which packages to run in codebuild
            ├── infra.ts
            ├── package.json
            ├── ...
        ├── connect-core                  # Custom Connect Instance CDK stack
            ├── ...                       # Same as `admin`
        ├── voicemail
        ├── ...                           # Other apps could be added (ie. CCP)
    ├── ...                               # Other configs...
    └── README.md
```

---

## Deployment

After setting up your configuration files, the first major step is to download `@ttec-dig-vf` dependencies into the `./packs` directory. See [NPM Pack](#npm-pack).

When everything is ready, run `npm run synth` followed by `npm run deploy` from the root -- this will run a script that will synth/deploy all the apps in the packages folder.

**_IMPORTANT_**: You will need to synth/deploy each package for every stage. This means if you have 3 stages, you will need to synth/deploy the admin, connect-core, connect-lambdas and voicemail apps 3 times each... meaning there will be a total of 12 CodeBuilds across whatever accounts are being used.

In other words, make sure you run synth/deploy from each `branch` you need to deploy to so that all apps will be deployed to each `branch`.

Once each package is deployed from your local machine, it will stand up a CDK stack with a CodeBuild construct. From this point forward, any development/iteration made to the github repo's correlating branch will automatically trigger that stack and build using the `buildspec.yml` within that package.

Each modular package is also set up to only run CodeBuild if changes are made within that `packages/*` folder.
For example, in the `packages/connect-core/infra.ts` file:

```typescript
  await GithubCodeBuild.create(app, `CICD${toPascal(stage)}`, {
      stackName: `${stagePrefix}-connect-core-cicd`,
      profile,
      env,
      projectName: `${project}-connect-core-${stage}`,
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
      ]
    });
  }
```

The `filePath` property is letting CodeBuild know that this stack will only be triggered on changes to the repo that affect files within `packages/connect-core/*`. If you are push changes to the admin app within the same branch, it will only build/deploy the admin app for that branch/stage.

Since each package is decoupled from one another, triggering multiple CodeBuilds from one push is possible (say if you made changes to both the admin and voicemail app at the same time).

---

## Private Dependencies

Private VF packages are stored in the GitHub registry. Use the following scripts to share them with clients, without granting access to our private registry.

### installPackFiles

Once you have installed (or updated) a private package from GitHub, use this script to store it in this repo.

```script
npm run installPackFiles
```

This will:

- Create a `./packs` folder.
- Recursively gather all packages installed in `node_modules/@ttec-dig-vf` of the root & any `packages/*` directories.
- Writes package tars to `./packs` folder.
- Remove the `node_modules` folder in all applicable directories.
- Remove `package-lock` files in all applicable directories.
- Reinstall dependencies using packs.
- Create an `overrides` field in the root package.json to force nested dependencies to use the local packs.

### resetPackFiles

Undo the overrides and `file:packs/` dependencies created by the installPackFiles script. The contents of `./packs` folder will remain intact.

```script
npm run resetPackFiles
```

### Upgrading

Use this process to upgrade private dependencies

```bash
npm run resetPackFiles
npm outdated

# Update dependencies as needed

npm run installPackFiles
```

## Unit / Integration testing

The test suite within `packages/connect-lambdas` provided is an example comprised of unit tests with jest.
From within the connect-lambdas directory, to run all tests execute:

```bash
npm run test
```

## Important things to know

_NOTE_: If you already have a Connect Instance:

  1. Remove the `connect-core` package from the repo.
  2. Remove the `connectCore` prop from your configs
  3. Add `existingConnect` prop to your configs.

```typescript
  client: 'vf',
  project: 'win',
  existingConnect: {
    instanceAlias: 'my-alias',
    instanceId: 'my-id',
  }
```

_NOTE_: If deleting stacks, by default voicemail and admin apps do not remove cognito resources. In addition, admin does not delete the dynamoDB table resource. The Connect-Storage stack does not delete the S3 bucket. All of these resources will need to be removed manually if you plan on re-deploying.

_NOTE_: Connect as a service limits the number of `CreateInstance` and `DeleteInstance` api calls that can be made against an account in a month. Please only create the instances and try not to build them for branches or you will get locked of building them. This is a hard limit and the number is unpublished. [see here](https://docs.aws.amazon.com/connect/latest/APIReference/API_CreateInstance.html) Once this happens there is nothing you can do about it. You won't even be able to build them from the console at that point.
