import { App } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { GithubCodeBuild } from '@ttec-dig-vf/cdk-resources';
import { getConfig, toPascal } from '../../lib';

const app = new App();

(async function buildInfra() {
  const config = await getConfig();
  const { profile, stage, env, prefix, branch, repo } = config;

  if (!(repo.name && repo.owner && repo.oauthSecretName)) {
    throw new Error(
      'repo name, repo owner, credentialsSecretName is not defined in config. These MUST be set before running codebuild.'
    );
  }
  await GithubCodeBuild.create(app, `CICD${toPascal(stage)}`, {
    stackName: `${prefix}-cicd`,
    env,
    profile,
    projectName: `${prefix}`,
    branch,
    repo: repo.name,
    owner: repo.owner,
    githubCredentialsSecretName: repo.oauthSecretName,
    buildSpec: `packages/cicd/buildspec.yml`,
    buildPolicyStatements: [
      new PolicyStatement({
        actions: ['connect:ListInstances', 'ds:DescribeDirectories'],
        resources: ['*']
      })
    ]
  });

  app.synth();
})();
