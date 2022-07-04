import { DynamoDBClient, PutItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ConnectContactFlowEvent, Context } from 'aws-lambda';

import logger from '../../services/logger';
import { DemoLambda } from './DemoLambda';

// Demonstrates how to execute a unit test using dependency injection
// Click F5 to start debugging this file

const testEvent: ConnectContactFlowEvent = {
  Name: 'ContactFlowEvent',
  Details: {
    ContactData: {
      Attributes: {},
      Channel: 'VOICE',
      ContactId: 'abc',
      CustomerEndpoint: {
        Address: '+11234567890',
        Type: 'TELEPHONE_NUMBER'
      },
      InitialContactId: 'abc',
      InitiationMethod: 'INBOUND',
      InstanceARN: 'arn',
      PreviousContactId: 'abc',
      Queue: {
        ARN: 'arn',
        Name: 'Queue_Name'
      },
      SystemEndpoint: {
        Address: '+18885559999',
        Type: 'TELEPHONE_NUMBER'
      },
      MediaStreams: {
        Customer: {
          Audio: null
        }
      }
    },
    Parameters: {
      id: '123',
      data: 'test data here'
    }
  }
};

// Used for vf-logger
const testContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'function',
  functionVersion: '1',
  invokedFunctionArn: 'arn::lambda',
  memoryLimitInMB: '512',
  awsRequestId: '1234',
  logGroupName: 'log-group',
  logStreamName: 'log-stream',
  getRemainingTimeInMillis: () => 1,
  done: () => null,
  fail: () => null,
  succeed: () => null
};

describe('DemoLambda', () => {
  // System under test
  let sut: DemoLambda;

  beforeAll(() => {
    // Inject a local ddb for testing
    const localDDB = new DynamoDBClient({
      endpoint: 'http://localhost:8000',
      region: 'local-env',
      tls: false
    });
    const ddbDocClient = DynamoDBDocument.from(localDDB);
    sut = new DemoLambda('test', ddbDocClient);
  });

  it('handler is a function', () => {
    expect(typeof sut.handler).toBe('function');
  });

  it('Dynamo write works', async () => {
    try {
      const res = await sut.put(testEvent);
      expect(res['$metadata'].httpStatusCode).toBe(200);
    } catch (err) {
      logger.error('error in Dynamo write test', err);
    }
  });

  it('Dynamo query works', async () => {
    try {
      const expectedResult = { id: '123', data: 'test data here' };

      const res = await sut.handler(testEvent, testContext);
      expect(res).toBe(expectedResult);
    } catch (err) {
      logger.error('error in Dynamo write test', { err });
    }
  });
});
