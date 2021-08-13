import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';

export class HostedZoneStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new route53.HostedZone(this, 'hogwash-hosted-zone', {
      zoneName: 'hogwash.xyz'
    });
  }
}
