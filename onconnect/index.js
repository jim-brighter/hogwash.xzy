const aws = require('aws-sdk');
const game = require('/opt/nodejs/game');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const lambda = new aws.Lambda({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const GAMES_TABLE = process.env.GAMES_TABLE;
const PLAYERS_TABLE = process.env.PLAYERS_TABLE;

const SEND_PLAYERS_FUNCTIONNAME = process.env.SEND_PLAYERS_FUNCTIONNAME;

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

    const lambdaResponse = await lambda.invoke({
        FunctionName: SEND_PLAYERS_FUNCTIONNAME,
        Payload: JSON.stringify({
            body: JSON.stringify({
                data: {
                    gameId: gameId
                }
            })
        }),
        InvocationType: 'Event'
    }).promise();

    console.log(lambdaResponse);

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
