const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;
const RESPONSE_ENDPOINT = process.env.RESPONSE_ENDPOINT;

exports.handler = async event => {
    const eventData = JSON.parse(event.body).data;
    const gameId = eventData.gameId;

    let gameResult;

    try {
        gameResult = await ddb.get({
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            }
        }).promise();
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

    const allPlayerNames = gameResult.Item.players.map((p) => {
        return p.name;
    });

    const postCalls = gameResult.Item.players.map(async (player) => {
        try {
            await gwManager.postToConnection({
                ConnectionId: player.connectionId,
                Data: JSON.stringify({
                    action: 'newplayer',
                    players: allPlayerNames
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
        body: 'Sent events'
    };
};
