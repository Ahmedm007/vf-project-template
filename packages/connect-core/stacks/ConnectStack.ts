import { Construct } from 'constructs';
import { Aws, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { ConnectProvider, ConnectInstance, ConnectInstanceProps } from '@ttec-dig-vf/cdk-resources';
import { IKey } from 'aws-cdk-lib/aws-kms';

const keyArn = (key?: IKey | string): string | undefined => {
  return typeof key === 'string' ? key : key?.keyArn;
};

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export interface ConnectStackProps extends StackProps, AtLeast<ConnectInstanceProps, 'instanceAlias'> {
  prefix: string;
  env: {
    account: string;
    region: string;
  };
}

/**
 * Creates a connect instance.
 * Exports Outputs:
 *  ${StackName}-InstanceAlias
 *  ${StackName}-InstanceId
 */
export class ConnectStack extends Stack {
  constructor(scope: Construct, id: string, props: ConnectStackProps) {
    super(scope, id, props);

    const connectProvider = new ConnectProvider(this, {
      env: props.env,
      prefix: props.prefix
    });

    const instance = new ConnectInstance(this, 'ConnectInstance', {
      ...props,
      instanceAlias: props.instanceAlias,
      identityManagementType: props.identityManagementType ?? 'CONNECT_MANAGED',
      inboundCallsEnabled: props.inboundCallsEnabled ?? true,
      outboundCallsEnabled: props.outboundCallsEnabled ?? true,
      connectProvider
    });
    instance.node.addDependency(connectProvider);

    this.cfnOutput('InstanceAlias', props.instanceAlias);
    this.cfnOutput('InstanceId', instance.instanceId);

    // By default these are the same values.
    this.cfnOutput('RecordingsKeyArn', keyArn(props.callRecordingsStorage?.key));
    this.cfnOutput('ChatTranscriptsKeyArn', keyArn(props.chatTranscriptsStorage?.key));
    this.cfnOutput('ReportsKeyArn', keyArn(props.reportsStorage?.key));
    this.cfnOutput('MediaKeyArn', keyArn(props.mediaStorage?.key), 'Used to encrypt KVS Media Streams');
  }

  cfnOutput(id: string, value?: string, description?: string) {
    new CfnOutput(this, id, {
      value: value || 'N/A',
      description,
      exportName: `${Aws.STACK_NAME}-${id}`
    });
  }
}
