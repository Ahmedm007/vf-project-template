import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { ConnectInstance, ConnectInstanceProps } from '@ttec-dig-vf/cdk-resources';

export interface ConnectInstanceStackProps extends StackProps, ConnectInstanceProps {}

export class ConnectInstanceStack extends Stack {
  constructor(scope: Construct, id: string, props: ConnectInstanceStackProps) {
    super(scope, id, props);
    new ConnectInstance(this, 'ConnectInstance', {
      ...props
    });
  }
}
