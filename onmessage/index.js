const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;

exports.handler = async event => {

    let connections;

    try {
        connections = await ddb.scan({
            TableName: GAMES_TABLE,
            ProjectionExpression: 'connectionId'
        }).promise();
    } catch(err) {
        return {
            statusCode: 500,
            body: err.stack
        };
    }

    const gwManager = new aws.ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
    });

    const data = JSON.parse(event.body).data;

    const postCalls = connections.Items.map(async ({connectionId}) => {
        try {
            await gwManager.postToConnection({
                ConnectionId: connectionId,
                Data: `${data.user}: ${data.message}`
            }).promise();
        } catch(err) {
            if (err.statusCode === 410) {
                console.log(`${connectionId} is stale, deleting...`);
                await ddb.delete({
                    TableName: GAMES_TABLE,
                    Key: {connectionId}
                }).promise();
            } else {
                console.error(JSON.stringify(err));
                throw err;
            }
        }
    });

    try {
        await Promise.all(postCalls);
    } catch(err) {
        console.error(JSON.stringify(err));
        return {
            statusCode: 500,
            body: err.stack
        };
    }

    return {
        statusCode: 200,
        body: 'Received'
    };
};
