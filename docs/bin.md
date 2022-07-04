# Bin Scripts

This section will go into more detail of the bin scripts and how to use them.

## Table of Contents

- [Bin Scripts](#bin-scripts)
  - [Table of Contents](#table-of-contents)
    - [bootstrap.ts](#bootstrapts)
    - [installPackFiles.ts](#installpackfilests)
    - [runCodeBuild.ts](#runcodebuildts)

### bootstrap.ts

This script is responsible for bootstrapping the AWS environments you have configured in the `config/` directory. In order to run the script, you must:

- be checked out on the master/main branch
- most not have any uncommitted changes on your local machine

This file will then run `installPackFiles.ts`.

Next, it will commit the updated package-lock file from your local machine to the repo.

Then, it will CDK bootstrap all the AWS environments configured in the `config/` directory.

Lastly, it will synth/deploy the CICD package to all the configured environments and run CodeBuild for each.

### installPackFiles.ts

```bash
npm installPackFiles
```

Stores all `@ttec-dig-vf` dependencies in the `./packs` folder and installs them. This allows us to deliver the dependencies without granting access to GitHub package manager.

### runCodeBuild.ts

```bash
# when deploying packages, it will run on the current checked out branch
npm run codebuild admin
npm run codebuild admin voicemail

# when deploying a branch, use the name in your config (*.config.ts)
npm run codebuild test

# this will deploy the admin app from the test branch, regardless of what branch you are currently checked out on
npm run codebuild test admin

```

This script will run CodeBuild for the package(s) or entire branch you specify...

Note: You CANNOT deploy the cicd package or the default config -- this is intentional.

For example, you can run any of the following from the root:
