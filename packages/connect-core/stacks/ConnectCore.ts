import { Construct } from 'constructs';
import { Environment } from 'aws-cdk-lib';
import {
  ConnectDataStorage,
  ConnectDataStorageProps,
  ConnectDataStreamingProps,
  ConnectDataStreamingStack
} from '@ttec-dig-vf/cdk-resources';
import { ConnectStack, ConnectStackProps } from './ConnectStack';

export interface ConnectCoreProps
  extends ConnectStackProps,
    Omit<ConnectDataStorageProps, 'client' | 'stage' | 'project' | 'env'>,
    Omit<ConnectDataStreamingProps, 'client' | 'project' | 'prefix'> {
  prefix: string;
  env: Required<Environment>;
}

export class ConnectCore extends Construct {
  constructor(scope: Construct, id: string, props: ConnectCoreProps) {
    super(scope, id);

    const storage = new ConnectDataStorage(this, 'ConnectStorage', {
      stackName: `${props.prefix}-storage`,
      ...props
    });
    if (!storage.buckets.storage || !storage.keys.shared) {
      throw new Error('Failed to create Connect data storage');
    }

    const streaming = new ConnectDataStreamingStack(this, 'ConnectDataStreaming', {
      ...props,
      stackName: `${props.prefix}-streaming`,
      streamDataBucket: storage.buckets.streaming,
      connectEncryptionKeyArn: storage.buckets.streaming?.encryptionKey?.keyArn
    });

    new ConnectStack(this, 'ConnectInstance', {
      ...props,
      stackName: `${props.prefix}-connect`,
      instanceAlias: props.instanceAlias,
      identityManagementType: props.identityManagementType ?? 'CONNECT_MANAGED',
      inboundCallsEnabled: props.inboundCallsEnabled ?? true,
      outboundCallsEnabled: props.outboundCallsEnabled ?? true,
      agentStream: streaming.agentStream?.streamArn,
      ctrStream: streaming.ctrStream?.streamArn,
      callRecordingsStorage: {
        bucket: storage.buckets.storage,
        key: storage.keys.shared,
        prefix: props.callRecordingsStorage?.prefix ?? 'recordings'
      },
      chatTranscriptsStorage: {
        bucket: storage.buckets.storage,
        key: storage.keys.shared,
        prefix: props.chatTranscriptsStorage?.prefix ?? 'transcripts'
      },
      reportsStorage: {
        bucket: storage.buckets.storage,
        key: storage.keys.shared,
        prefix: props.reportsStorage?.prefix ?? 'reports'
      },
      mediaStorage: {
        key: storage.keys.shared,
        prefix: props.prefix,
        retentionPeriodInHours: props.mediaStorage?.retentionPeriodInHours
      }
    });
  }
}
