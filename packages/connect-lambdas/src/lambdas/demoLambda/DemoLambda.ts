import { PutItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ConnectContactFlowEvent, Context } from 'aws-lambda';

import logger from '../../services/logger';

export interface TableEntry {
  id: string;
  data: string;
}
/**
 * Demonstrates DDB interaction in a lambda.
 * Use Dependency Injection on the constructor to make testing easier.
 */
export class DemoLambda {
  constructor(private tableName: string, private dynamodb: DynamoDBDocument) {
    if (!this.tableName) {
      throw new Error('tableName is required');
    }
  }

  public async handler(event: ConnectContactFlowEvent, context: Context): Promise<TableEntry | undefined> {
    // vf-logger
    logger.withRequest(event, context);
    logger.info({ event });

    const { id } = event.Details.Parameters;

    try {
      const queryResult = await this.dynamodb.get({
        TableName: this.tableName,
        Key: {
          id
        }
      });
      return queryResult.Item as TableEntry;
    } catch (err) {
      logger.error({ err });
      throw err;
    }
  }

  public async put(event: ConnectContactFlowEvent): Promise<PutItemCommandOutput> {
    const { id, data } = event.Details.Parameters;
    try {
      return await this.dynamodb.put({
        TableName: this.tableName,
        Item: {
          id,
          data
        } as TableEntry,
      });
    } catch (err) {
      logger.error({ err });
      throw err;
    }
  }
}
