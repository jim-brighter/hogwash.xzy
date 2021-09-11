const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;
const RESPONSE_ENDPOINT = process.env.RESPONSE_ENDPOINT;

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
        endpoint: RESPONSE_ENDPOINT
    });

    const postCalls = players.map(async (player) => {
        try {
            await gwManager.postToConnection({
                ConnectionId: player.connectionId,
                Data: JSON.stringify({
                    user: eventData.user,
                    message: eventData.message,
                    action: 'sendmessage'
                })
            }).promise();
        } catch(err) {
            if (err.statusCode === 410) {
                console.log(`${player.connectionId} is stale`);
            } else {
                console.error(`Error sending data to ${player.connectionId} in game ${gameId}: ${JSON.stringify(err)}`);
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
