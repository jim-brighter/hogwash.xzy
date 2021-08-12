const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;

exports.handler = async event => {

    const eventData = JSON.parse(event.body).data;
    const gameId = eventData.gameId;

    let players;

    try {
        const gameRecord = await ddb.get({
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            }
        }).promise();

        players = gameRecord.Item.players;
    } catch(e) {
        console.error(`Error retrieving game ${gameId}: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: `Error retrieving game ${gameId}: ${JSON.stringify(e)}`
        };
    }

    const gwManager = new aws.ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
    });

    const postCalls = players.map(async (player) => {
        try {
            await gwManager.postToConnection({
                ConnectionId: player.connectionId,
                Data: `${eventData.user}: ${eventData.message}`
            }).promise();
        } catch(err) {
            if (err.statusCode === 410) {
                console.log(`${connectionId} is stale`);
            } else {
                console.error(`Error sending data to ${connectionId} in game ${gameId}: ${JSON.stringify(err)}`);
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
            body: JSON.stringify(err)
        };
    }

    return {
        statusCode: 200,
        body: 'Received'
    };
};
