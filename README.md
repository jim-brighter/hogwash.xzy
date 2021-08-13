# hogwash.xzy
A free-to-play online version of the board game Balderdash. Runs serverlessly in AWS with Lambda, API Gateway, and DynamoDB. Deployed via [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

----

### Chatroom Testing Notes
- To Connect with `wscat`:
```bash
wscat -H X-Player-Name:<name> -H X-Game-Id:<gameId> -c <websocket url>
```
- To send a message:
```bash
{"action": "sendmessage", "data": {"gameId": "<gameId>", "user": "<name>", "message": "hello world"}}
```
