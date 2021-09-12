const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;
const PLAYERS_TABLE = process.env.PLAYERS_TABLE;

const RESPONSE_ENDPOINT = process.env.RESPONSE_ENDPOINT;

const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

exports.handler = async event => {
    const connectionId = event.requestContext.connectionId;
    const playerName = event.queryStringParameters.playerName;
    const gameId = event.queryStringParameters.gameId;

    console.log(`Connecting ${connectionId} to ${gameId}`);

    const player = new game.Player(connectionId, playerName);

    const ttl = Math.floor(Date.now() / 1000) + EIGHT_HOURS_IN_SECONDS;

    let gameResult;

    try {
        gameResult = await ddb.get({
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            }
        }).promise();
    } catch(err) {
        console.error(`Error: ${JSON.stringify(err)}`);
        return {
            statusCode: 500,
            body: `Failed to retrieve ${gameId}: ${JSON.stringify(err)}`
        };
    }

    if (gameResult.Item !== undefined && gameResult.Item !== null) {
        console.log(`Found game with id ${gameId}, updating with new player ${player.name}`);
        const updateParams = {
            TableName: GAMES_TABLE,
            Key: {
                gameId: gameId
            },
            UpdateExpression: "set players = list_append(players, :vals), #a = :ttl",
            ExpressionAttributeNames: {
                "#a": "ttl"
            },
            ExpressionAttributeValues: {
                ":vals": [player],
                ":ttl": ttl
            }
        };

        try {
            await ddb.update(updateParams).promise();
        } catch(e) {
            console.error(`Error updating game: ${JSON.stringify(e)}`);
            return {
                statusCode: 500,
                body: `Failed to connect ${player.name} to ${gameId}: ${JSON.stringify(e)}`
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
                        players: allPlayerNames.concat([playerName])
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

    } else {
        console.log(`Game with id ${gameId} not found, creating a new one`);

        const newGame = new game.Game(gameId, ttl);
        newGame.players = [player];
        newGame.rounds = ['test'];

        const putParams = {
            TableName: GAMES_TABLE,
            Item: newGame
        };

        try {
            await ddb.put(putParams).promise();
        } catch(e) {
            console.error(`Error saving new game: ${JSON.stringify(e)}`);
            return {
                statusCode: 500,
                body: `Failed to connect ${player.name} to ${gameId}: ${JSON.stringify(e)}`
            };
        }
    }

    try {
        console.log(`Adding ${connectionId} to ${PLAYERS_TABLE}`);

        const putParams = {
            TableName: PLAYERS_TABLE,
            Item: {
                connectionId: connectionId,
                gameId: gameId,
                ttl: ttl
            }
        };

        await ddb.put(putParams).promise();
    } catch(e) {
        console.error(`Error adding player to ${PLAYERS_TABLE}: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: `Failed to connect ${player.name}: ${JSON.stringify(e)}`
        };
    }

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
