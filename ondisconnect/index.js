const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const GAMES_TABLE = process.env.GAMES_TABLE;
const PLAYERS_TABLE = process.env.PLAYERS_TABLE;

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

exports.handler = async event => {
    const connectionId = event.requestContext.connectionId;

    console.log(`Disconnecting ${connectionId}`);

    let playerRecord;
    try {
        playerRecord = await ddb.get({
            TableName: PLAYERS_TABLE,
            Key: {
                connectionId: connectionId
            }
        }).promise();
    } catch(e) {
        console.error(`Couldn't retrieve player record for connectionId ${connectionId}: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: `Couldn't retrieve player record for connectionId ${connectionId}: ${JSON.stringify(e)}`
        };
    }

    const gameId = playerRecord.Item.gameId;

    let gameRecord;
    try {
        gameRecord = await ddb.get({
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            }
        }).promise();
    } catch(e) {
        console.error(`Couldn't find game with id ${gameId} for connectionId ${connectionId}: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: `Couldn't find game with id ${gameId} for connectionId ${connectionId}: ${JSON.stringify(e)}`
        };
    }

    if (gameRecord.Item.players.length === 1) {
        console.log(`Game ${gameId} only has 1 player, deleting game`);

        const deleteParams = {
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            }
        };

        try {
            await ddb.delete(deleteParams).promise();
        } catch(err) {
            console.error(`Failed to delete game ${gameId}: ${JSON.stringify(err)}`);
            return {
                statusCode: 500,
                body: `Failed to delete game ${gameId}: ${JSON.stringify(err)}`
            };
        }
    } else {
        console.log(`Game ${gameId} has more than 1 player, removing player`);

        const playerIndex = gameRecord.Item.players.findIndex(p => p.connectionId === connectionId);

        const updateParams = {
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            },
            UpdateExpression: `remove players[${playerIndex}]`
        };

        try {
            await ddb.update(updateParams).promise();
        } catch(e) {
            console.error(`Error updating game: ${JSON.stringify(e)}`);
            return {
                statusCode: 500,
                body: `Failed to disconnect ${connectionId} from ${gameId}: ${JSON.stringify(e)}`
            };
        }
    }

    const deleteParams = {
        TableName: PLAYERS_TABLE,
        Key: {
            connectionId: connectionId
        }
    };

    try {
        await ddb.delete(deleteParams).promise();
    } catch(err) {
        console.error(`Failed to disconnect: ${JSON.stringify(err)}`);
        return {
            statusCode: 500,
            body: `Failed to disconnect: ${JSON.stringify(err)}`
        };
    }

    return {
        statusCode: 200,
        body: 'Disconnected'
    };
};
