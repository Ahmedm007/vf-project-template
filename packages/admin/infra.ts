import { App } from 'aws-cdk-lib';
import { AdminStack, AdminStackProps } from '@ttec-dig-vf/vf-connect-admin';
import { getConfig } from '../../lib';

const app = new App();

(async function buildInfra() {
  const config = await getConfig();
  const { prefix, client, stage, admin, connectInstanceId } = config;

  if (!admin) {
    throw new Error(`no admin app configuration in ${stage}.config.ts`);
  }

  const defaultFeatures = {
    calendarManagementEnabled: true,
    configSetManagement: true,
    connectUserManagementEnabled: false,
    flowEngineManagementEnabled: false,
    syncManagementEnabled: false,
    permissionsManagementEnabled: false,
    tenancyEnabled: false
  };

  const adminProps: Omit<AdminStackProps, 'assets'> = {
    client,
    stage,
    // env,
    //stackName: `${prefix}-admin`,  -this version of AdminStack doesn't support stackName
    connectInstanceId,
    loggingLevel: admin.loggingLevel,
    adminUserEmail: admin?.adminUserEmail || 'test@adminemail.com',
    retain: admin.retain,
    useLayer: admin.useLayer,
    features: admin.features || defaultFeatures
  };

  new AdminStack(app, `${prefix}-admin`, adminProps);

  app.synth();
})();
