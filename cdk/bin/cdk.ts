#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BackendStack } from '../lib/backend';
import { FrontendStack } from '../lib/frontend';
import { HostedZoneStack } from '../lib/hosted-zone';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new BackendStack(app, 'HogwashBackend', {env});

new FrontendStack(app, 'HogwashFrontend', {env})

new HostedZoneStack(app, 'HogwashHostedZone', {env});
