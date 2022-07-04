# Lib Scripts

This section will go into more detail of the lib scripts, explaining what they are and how they are used.

## Table of Contents

- [Lib Scripts](#lib-scripts)
  - [Table of Contents](#table-of-contents)
    - [changeCase.ts](#changecasets)
    - [directoryUtils.ts](#directoryutilsts)
    - [getAWSAccounts.ts](#getawsaccountsts)
    - [getConfig.ts](#getconfigts)
    - [privateModuleUtils.ts](#privatemoduleutilsts)

### changeCase.ts

Provides string manipulation functions that will convert a string to a specified typographical standard (ie. kebab-case, camelCase, PascalCase)

### directoryUtils.ts

Functions that can provide the absolutely directory paths of specified locations within the repo (ie. Root, package directories, etc.)

- fromRoot
- getDirectoriesAtPath
- getPackageDirectories
- getPackageNames

### getAWSAccounts.ts

Function that looks into the `config/` directory of the repo, finds any files following the pattern: `*.config.ts` and ensures the following properties exist on the config file:

- account.id
- account.region
- account.profile

It will return the AWS account info as well as the branch name of the config file (ie. 'test' if looking at `test.config.ts`)

### getConfig.ts

Houses multiple functions:

- getStage
  - Normalizes branch name to standard stage names for deployment
- getLocalGitBranch
  - Get the current branch from local git
- getConfigFromFile
  - returns the config object within the specified config file parameter
- getProdConfig
  - returns the config object for the Production stage -- this will be derived from either a named `master` or `main` config file. Throws an error if you have both/neither configs set up on the repo (as you can only have one).
- getConfig
  - returns all the required configurations in order to deploy the checked out branch to AWS. This will grab the config for the current branch, as well as the production config (in order to deploy/refer to CA in prod) to be passed to whatever stacks/packages you are standing up.

More detailed descriptions of these functions are self-documented.