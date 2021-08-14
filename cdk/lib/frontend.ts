import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deployment from '@aws-cdk/aws-s3-deployment';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

export class FrontendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 SITE

    const frontendRootBucket = new s3.Bucket(this, 'HogwashFrontendRootBucket', {
        bucketName: 'hogwash.xyz',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        versioned: true,
        publicReadAccess: true,
        websiteIndexDocument: 'index.html'
      });

      const frontendSubdomainBucket = new s3.Bucket(this, 'HogwashFrontendSubdomainBucket', {
        bucketName: 'www.hogwash.xyz',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        versioned: true,
        websiteRedirect: {
          hostName: 'hogwash.xyz',
          protocol: s3.RedirectProtocol.HTTP
        }
      });

      const frontendDeployment = new s3deployment.BucketDeployment(this, 'HogwashFrontendDeployment', {
        sources: [s3deployment.Source.asset('../frontend')],
        destinationBucket: frontendRootBucket
      });

      // ROUTE 53

      const hostedZone = route53.HostedZone.fromLookup(this, 'hostedZone', {
        domainName: 'hogwash.xyz'
      });

      const rootARecord = new route53.ARecord(this, 'HogwashRootRecord', {
        zone: hostedZone,
        target: {
          aliasTarget: new targets.BucketWebsiteTarget(frontendRootBucket)
        }
      });

      const subdomainARecord = new route53.ARecord(this, 'HogwashSubdomainRecord', {
        zone: hostedZone,
        recordName: 'www',
        target: {
          aliasTarget: new targets.BucketWebsiteTarget(frontendSubdomainBucket)
        }
      });
    }
}
