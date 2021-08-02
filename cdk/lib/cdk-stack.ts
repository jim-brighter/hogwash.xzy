import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as gw from '@aws-cdk/aws-apigatewayv2';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DYNAMO TABLES

    const connectionTable = new ddb.Table(this, 'ConnectionsTable', {
      partitionKey: {
        name: 'connectionId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'HogwashConnections',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl'
    });

    // LAMBDA FUNCTIONS

    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'onconnect')),
      environment: {
        'TABLE_NAME': connectionTable.tableName
      }
    });
    connectionTable.grantReadWriteData(connectHandler);

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'ondisconnect')),
      environment: {
        'TABLE_NAME': connectionTable.tableName
      }
    });
    connectionTable.grantReadWriteData(disconnectHandler);

    const defaultHandler = new lambda.Function(this, 'DefaultHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'ondefault'))
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'onmessage')),
      environment: {
        'TABLE_NAME': connectionTable.tableName
      }
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

    new gw.WebSocketStage(this, 'WebsocketApiStage', {
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
  }
}
