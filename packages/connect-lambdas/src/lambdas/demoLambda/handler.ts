import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ConnectContactFlowEvent, Context } from 'aws-lambda';

import { DemoLambda } from './DemoLambda';

// This file is the entry point to your lambda. Do your configuration/setup here.

const dynamoDB = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocument.from(dynamoDB);
const demoLambda = new DemoLambda(process.env.TABLE as string, ddbDocClient);

/**
 * This handler is executed by the lambda runtime.
 */
export const handler = async (event: ConnectContactFlowEvent, context: Context) => {
  return await demoLambda.handler(event, context);
};
