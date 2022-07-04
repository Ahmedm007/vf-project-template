import { App } from 'aws-cdk-lib';
import { ConnectLambdas } from './stacks/ConnectLambdas';
import { getConfig } from '../../lib';

const app = new App();

(async function buildInfra() {
  const config = await getConfig();
  const { prefix, client, env, stage, connectInstanceId, connectLambdas } = config;

  if (!connectLambdas) {
    throw new Error(`no connect-lambdas configuration in ${stage}.config.ts`);
  }

  new ConnectLambdas(app, `${prefix}-connect-lambdas`, {
    env,
    client,
    stage,
    secretName: `${prefix}-lambdas`,
    prefix,
    connectInstanceId,
    loggingLevel: connectLambdas.loggingLevel
  });

  app.synth();
})();
