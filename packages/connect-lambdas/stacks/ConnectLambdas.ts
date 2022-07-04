import { resolve } from 'path';

import { BillingMode, Table, AttributeType, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

export interface ConnectLambdasProps extends StackProps {
  client: string;
  stage?: string;
  env: {
    account: string;
    region: string;
  };
  loggingLevel: 'debug' | 'info' | 'error';
  prefix: string;
  secretArn?: string;
  secretName?: string;
  connectInstanceId: string;
}

export class ConnectLambdas extends Stack {
  public lambdas: NodejsFunction[];
  constructor(scope: Construct, id: string, props: ConnectLambdasProps) {
    super(scope, id, props);

    const { env, stage, loggingLevel, prefix, connectInstanceId } = props;

    const removalPolicy = props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const connectTable = new Table(this, 'ConnectTable', {
      partitionKey: {
        name: 'contentType',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'contentKey',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: `${props.prefix}-connect-table`,
      timeToLiveAttribute: 'TimeToLive',
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy
    });

    const getLambdaEntry = (lambdaName: string) => {
      return resolve(__dirname, '..', 'src', 'lambdas', lambdaName, 'handler.ts');
    };

    const globalFunctionProps: NodejsFunctionProps = {
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(8),
      logRetention: RetentionDays.ONE_MONTH,
      logRetentionRetryOptions: { maxRetries: 10 },
      memorySize: 1024
    };

    const globalEnvVars = {
      LOG_LEVEL: loggingLevel as string,
      ENVIRONMENT: stage as string
    };

    const demoLambda = new NodejsFunction(this, 'demoLambda', {
      ...globalFunctionProps,
      entry: getLambdaEntry('demoLambda'),
      functionName: `${prefix}-demoLambda`,
      environment: {
        ...globalEnvVars,
        SERVICE_NAME: `${prefix}-demoLambda`,
        TABLE: connectTable.tableName
      }
    });

    this.lambdas = [demoLambda];

    const addConnectPermission = (lambdaFunction: NodejsFunction): void => {
      lambdaFunction.addPermission(`${lambdaFunction.node.id}ConnectPermission`, {
        principal: new ServicePrincipal('connect.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceAccount: env.account,
        sourceArn: `arn:aws:connect:${env.region}:${env.account}:instance/${connectInstanceId}`
      });
    };

    this.lambdas.forEach(lambda => {
      addConnectPermission(lambda);
      connectTable.grantReadWriteData(lambda);
    });
  }
}
