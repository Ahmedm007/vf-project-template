import { Configuration } from './Configuration';

const config: Configuration = {
  client: 'client-name',
  project: 'project-name',
  repo: {
    host: 'GitHub',
    name: 'repo-name',
    owner: 'TTEC-Dig-VF',
    oauthSecretName: 'secret-name' //from Secrets Manager
  },
  account: {
    profile: 'aws-profile',
    region: 'xx-xxxx-x',
    id: '000000000000'
  },
  // Use existingConnect prop instead if using an existing instance
  connectCore: {
    instanceAlias: 'instance-name'
  },
  //optional packages:
  //see https://github.com/TTEC-Dig-VF/vf-project-template/blob/main/docs/packages.md#how-to-add-a-package
  //for adding new packages
  admin: {
    adminUserEmail: 'admin@email.com',
    loggingLevel: 'debug',
    retain: false,
    useLayer: true,
    features: {
      calendarManagementEnabled: true,
      configSetManagement: true,
      connectUserManagementEnabled: false,
      flowEngineManagementEnabled: false,
      syncManagementEnabled: false,
      permissionsManagementEnabled: false,
      tenancyEnabled: false
    }
  },
  connectLambdas: {
    loggingLevel: 'debug'
  },
  voicemail: {
    replyEmail: 'reply@email.com'
  }
};
export default config;
