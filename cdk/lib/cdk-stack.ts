import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as gw from '@aws-cdk/aws-apigatewayv2';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DYNAMO TABLES

    const connectionTable = new ddb.Table(this, 'GamesTable', {
      partitionKey: {
        name: 'gameId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'HogwashGames',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl'
    });

    const playerGameMap = new ddb.Table(this, 'PlayerGameMap', {
      partitionKey: {
        name: 'connectionId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'HogwashPlayers',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl'
    });

    // LAMBDA FUNCTIONS

    const libLayer = new lambda.LayerVersion(this, 'HogwashLibs', {
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      code: lambda.Code.fromAsset(path.join('..', 'hogwashlibs'))
    });

    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'onconnect')),
      environment: {
        'GAMES_TABLE': connectionTable.tableName,
        'PLAYERS_TABLE': playerGameMap.tableName
      },
      layers: [libLayer],
      logRetention: logs.RetentionDays.ONE_DAY
    });
    connectionTable.grantReadWriteData(connectHandler);
    playerGameMap.grantReadWriteData(connectHandler);

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'ondisconnect')),
      environment: {
        'GAMES_TABLE': connectionTable.tableName,
        'PLAYERS_TABLE': playerGameMap.tableName
      },
      layers: [libLayer],
      logRetention: logs.RetentionDays.ONE_DAY
    });
    connectionTable.grantReadWriteData(disconnectHandler);
    playerGameMap.grantReadWriteData(disconnectHandler);

    const defaultHandler = new lambda.Function(this, 'DefaultHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'ondefault')),
      logRetention: logs.RetentionDays.ONE_DAY
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'onmessage')),
      environment: {
        'GAMES_TABLE': connectionTable.tableName
      },
      layers: [libLayer],
      logRetention: logs.RetentionDays.ONE_DAY
    });
    connectionTable.grantReadWriteData(messageHandler);

    // WEBSOCKET API

    const webSocketApi = new gw.WebSocketApi(this, 'WebsocketApi', {
      apiName: 'HogwashWebsocketApi',
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: {
        integration: new integrations.LambdaWebSocketIntegration({
          handler: connectHandler
        })
      },
      disconnectRouteOptions: {
        integration: new integrations.LambdaWebSocketIntegration({
          handler: disconnectHandler
        })
      },
      defaultRouteOptions: {
        integration: new integrations.LambdaWebSocketIntegration({
          handler: defaultHandler
        })
      }
    });

    webSocketApi.addRoute('sendmessage', {
      integration: new integrations.LambdaWebSocketIntegration({
        handler: messageHandler
      })
    });

    const wsStage = new gw.WebSocketStage(this, 'WebsocketApiStage', {
      webSocketApi,
      stageName: 'hogwash',
      autoDeploy: true
    });

    // IAM ROLE

    const websocketConnectionsArn: string = this.formatArn({
      resource: webSocketApi.apiId,
      service: 'execute-api',
      resourceName: '*'
    });

    const lambdaApiGWPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      effect: iam.Effect.ALLOW,
      resources: [websocketConnectionsArn]
    });

    messageHandler.addToRolePolicy(lambdaApiGWPolicy);

    new cdk.CfnOutput(this, 'wsUrl', {
      value: wsStage.url,
      exportName: 'wsUrl'
    });
  }
}
