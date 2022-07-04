# VF-Deploy Integration

[VF-DEPLOY](https://github.com/TTEC-Dig-VF/vf-deploy) is a project used often for backing up and restoring Connect and OMP resources. This is commonly used for migrating resources between Connect instances and OMP applications. The steps for incorporating this project into the project template (or any other project for that matter) are documented in the [vf-deploy](https://github.com/TTEC-Dig-VF/vf-deploy) repo. This guide serves as a quick-start for adding it to the project template and therefore takes a minimalist approach for incorporation. For the complete guide along with configuration options, see the [vf-deploy](https://github.com/TTEC-Dig-VF/vf-deploy) repo. For an example vf-deploy integration see this _vf-project-template_ branch: [example/vf-deploy](https://github.com/TTEC-Dig-VF/vf-project-template/tree/example/vf-deploy).

---

## 1. Install the package

To install, execute the following command from the vf-project-template root in your terminal:

```
npm i -D @ttec-dig-vf/vf-deploy
```

---

## 2. Add Configuration

The example configuration below provides a simple configuration that enables us to extract data from a single Connect instance. For complete configuration options see the [vf-deploy configuration options](https://github.com/TTEC-Dig-VF/vf-deploy/blob/main/docs/02-Configuration.md).

Add the below demo configuration file to **./config** and update the AWS environment and vf-deploy options accordingly:

### ./config/vf-deploy.ts

```typescript
import { MigrationConfig } from '@ttec-dig-vf/vf-deploy';

export const demoConfig: MigrationConfig = {
  environments: [
    {
      name: 'sample-env',
      account: '123458675309',
      region: 'us-east-1',
      profile: 'teamX',
      connectInstanceAlias: 'example-corp-testing',
      allowedActions: ['extract', 'publish'],
      ompTableName: ''
    }
  ],
  // This section is used to define the extract, publish, and clean-up behavior of the app
  resources: {
    connect: {
      AgentStatus: { extract: { enabled: true }, publish: { enabled: true }, delete: { enabled: true } },
      ContactFlow: { extract: { enabled: true } },
      ContactFlowModule: { extract: { enabled: true } },
      HoursOfOperation: { extract: { enabled: true } },
      Prompt: { extract: { enabled: true } },
      Queue: { extract: { enabled: true } },
      QuickConnect: { extract: { enabled: true } },
      RoutingProfile: { extract: { enabled: true } },
      SecurityProfile: { extract: { enabled: true } },
      User: { extract: { enabled: true } },
      UserHierarchy: { extract: { enabled: true } }
    }
  }
};
```

---

## 3. Add CLI Builder Class

Add the following file to the **./bin** directory. This imports the _config_ named _demoConfig_ from the previous step. This could be customized accordingly.

### ./bin/manage.ts

```typescript
#!ts-node
import { CLI, CLIBuilder, DefaultNameTransformer, INameTransformer, MigrationConfig } from '@ttec-dig-vf/vf-deploy';
import { demoConfig as config } from '../config/vf-deploy';

// Builder class to support customization.
export class Builder implements CLIBuilder {
  getNameTransformer(): INameTransformer {
    return new DefaultNameTransformer();
  }
}

// Executes the actual command-line interface for the deploy manager framework.
new CLI(new Builder(), config).exec();
```

For Mac / Linux / WSL environments, set the executable flag on this file:

```
chmod +rwx ./bin/manage.ts
```

---

## 4. Create Data Folder for Resources Extracted / Published

The resources extracted and published need a data folder to contain them. A good way to do this is to create a separate _vf-deploy_ folder in the project for clarity, however this data folder can be named whatever you choose (see --data-path implications in next step)

```
mkdir vf-deploy
```

---

## 5. Execute the Project

It is prefrerred to execute using the _npx ts-node_ command for system compatibility. A good way to do this is add an npm script to the package.json file such as in the example below. Note the _--data-path_ parameter indicates the data folder determined in the previous step. Update the command accordingly.

```json
//...
"scripts": {
    //...
    "manage:extract": "npx ts-node bin/manage.ts extract --env sample-env --data-path ./vf-deploy",
    //...
  },
```

Finally, run this vf-deploy extraction command from your terminal:

```
npm run manage:extract
```

---

## More Info

For additional command and configuration options see the [vf-deploy](https://github.com/TTEC-Dig-VF/vf-deploy) repo.
