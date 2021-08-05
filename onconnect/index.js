const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const X_PLAYER_NAME = 'X-Player-Name';
const X_GAME_ID = 'X-Game-Id';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

exports.handler = async event => {
    const connectionId = event.requestContext.connectionId;
    const playerName = event.headers[X_PLAYER_NAME];
    const gameId = event.headers[X_GAME_ID];

    console.log(`Connecting ${connectionId} to ${gameId}`);

    const player = new game.Player(connectionId, playerName);

    const ttl = Math.floor(Date.now() / 1000) + (48*60*60);

    let gameResult;

    try {
        gameResult = await ddb.get({
            TableName: process.env.TABLE_NAME,
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
            TableName: process.env.TABLE_NAME,
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
    } else {
        console.log(`Game with id ${gameId} not found, creating a new one`);

        const newGame = new game.Game(gameId, ttl);
        newGame.players = [player];
        newGame.rounds = ['test'];

        const putParams = {
            TableName: process.env.TABLE_NAME,
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

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
