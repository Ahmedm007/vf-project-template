// eslint-disable-next-line no-undef
module.exports = {
  tables: [
    {
      TableName: 'test',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'data', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'data', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  ]
};
