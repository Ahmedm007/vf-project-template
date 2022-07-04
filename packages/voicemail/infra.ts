import { App, Fn } from 'aws-cdk-lib';
import { VoiceMailApp } from '@ttec-dig-vf/connect-voicemail';
import { getConfig } from '../../lib';

const app = new App();

(async function buildInfra() {
  const config = await getConfig();
  const { client, project, env, prefix, stage, branch, connectInstanceId, voicemail } = config;
  if (!voicemail) {
    throw new Error(`no voicemail app configuration in ${branch}.config.ts`);
  }

  // Use exported value if connectCore is defined
  const kvsEncryptionKeyArn = config.connectCore
    ? Fn.importValue(`${prefix}-connect-MediaKeyArn`)
    : voicemail.kvsEncryptionKeyArn;

  new VoiceMailApp(app, `${prefix}-voicemail`, {
    client,
    project: `${project}-vm`,
    stage,
    connectInstanceId,
    env,
    ...voicemail,
    kvsEncryptionKeyArn
  });

  app.synth();
})();
