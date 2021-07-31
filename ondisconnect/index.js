const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
});

exports.handler = async event => {
    const connectionId = event.requestContext.connectionId;

    console.log(`Disconnecting ${connectionId}`);

    const deleteParams = {
        TableName: process.env.TABLE_NAME,
        Key: {
            connectionId: connectionId
        }
    };

    try {
        await ddb.delete(deleteParams).promise();
    } catch(err) {
        return {
            statusCode: 500,
            body: `Failed to disconnect:  + ${JSON.stringify(err)}`
        };
    }

    return {
        statusCode: 200,
        body: 'Disconnected'
    };
};
