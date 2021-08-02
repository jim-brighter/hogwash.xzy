const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

exports.handler = async event => {
    const connectionId = event.requestContext.connectionId;

    console.log(`Connecting ${connectionId}`);

    const putParams = {
        TableName: process.env.TABLE_NAME,
        Item: {
            connectionId: connectionId,
            ttl: Math.floor(Date.now() / 1000) + (48*60*60)
        }
    };

    try {
        await ddb.put(putParams).promise();
    } catch(err) {
        return {
            statusCode: 500,
            body: `Failed to connect:  + ${JSON.stringify(err)}`
        };
    }

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
