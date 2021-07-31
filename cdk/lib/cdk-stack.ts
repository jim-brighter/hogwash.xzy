import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as gw from '@aws-cdk/aws-apigatewayv2';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const defaultHandler = new lambda.Function(this, 'DefaultHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'default-handler'))
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join('..', 'message-handler'))
    });

    const webSocketApi = new gw.WebSocketApi(this, 'WebsocketApi', {
      apiName: 'HogwashWebsocketApi',
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: {
        integration: new integrations.LambdaWebSocketIntegration({
          handler: defaultHandler
        })
      },
      disconnectRouteOptions: {
        integration: new integrations.LambdaWebSocketIntegration({
          handler: defaultHandler
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
      stageName: 'dev',
      autoDeploy: true
    });
  }
}
