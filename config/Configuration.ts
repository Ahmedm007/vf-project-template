//import interfaces from the packages/ folder directly from the CDK app you are working on like the example below
//this helps create unified a central config file for all packages in the monorepo.
import { VoiceMailProps } from '@ttec-dig-vf/connect-voicemail';
import { AdminStackProps } from '@ttec-dig-vf/vf-connect-admin';
import { ConnectCoreProps } from '../packages/connect-core/stacks/ConnectCore';
import { ConnectLambdasProps } from '../packages/connect-lambdas/stacks/ConnectLambdas';

/**
 * Repository Configuration
 */
interface RepoConfig {
  /**
   * repository host. Options: GitHub | CodeCommit | Bitbucket
   */
  host: 'GitHub' | 'CodeCommit' | 'Bitbucket';
  /**
   * repository owner. necessary if using a <host> of GitHub or Bitbucket
   */
  owner?: string;
  /**
   * repository name.
   */
  name?: string;
  /**
   * AWS Secrets Manager secret name that stores the GitHub or Bitbucket auth token
   */
  oauthSecretName?: string;
  /**
   * repository ARN if the <host> is set to CodeCommit
   */
  repoArn?: string;
}

/**
 * AWS Account Details
 */
interface Account {
  /**
   * AWS Profile to use for the deployment
   */
  profile: string;
  /**
   * AWS Region for the deployment
   */
  region: string;
  /**
   * AWS Account ID for the deployment
   */
  id: string;
}

/**
 * Deployment Configuration
 * Note: resources for this deployment will typically have a resource names containing <client>-<project>-<stage>
 * ex. shelter-amshield-dev
 */
export interface Configuration {
  /**
   * Name of the client for the configuration (ex. shelter)
   * Note: try to keep these names shorter (2-8 characters) to avoid name limit lengths for resources
   */
  client: string;
  /**
   * Name of the project for the configuration (ex. amshield)
   * Note: try to keep these names shorter (2-8 characters) to avoid name limit lengths for resources
   */
  project: string;
  /**
   * AWS Account information for the deployment
   */
  account: Account;
  /**
   * Repository information for the deployment
   */
  repo: RepoConfig;

  /**
   * Set these props if you are attaching to an existing connect instance.
   * If set, connectCore props will be ignored.
   */
  existingConnect?: {
    instanceAlias: string;
    instanceId: string;
  };

  /**
   * If 'connect-core' present in the packages folder, supports configuration for the connect instance and associated resources
   * You must set this if existingConnect is undefined.
   */
  connectCore?: Omit<ConnectCoreProps, 'prefix' | 'env'>;

  /**
   * If 'connect-lambdas' present in the packages folder, supports configuration for custom lambdas associated with the connect instance
   */
  connectLambdas?: Omit<ConnectLambdasProps, 'client' | 'stage' | 'prefix' | 'connectInstanceId' | 'env'>;

  /**
   * If 'admin' present in the packages folder, supports configuration for the Operations Management Portal (OMP) resources
   */
  admin?: Omit<AdminStackProps, 'client' | 'stage' | 'connectInstanceId' | 'assets'>;

  /**
   * If 'voicemail' present in the packages folder, supports configuration for Voicemail application resources
   */
  voicemail?: Omit<VoiceMailProps, 'client' | 'stage' | 'project' | 'connectInstanceId' | 'env'>;
}
