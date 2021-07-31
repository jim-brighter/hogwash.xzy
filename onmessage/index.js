exports.handler = async event => {

    const data = JSON.parse(event.body).data;

    console.log(`received: ${data.message} from ${data.user}`);

    return {
        statusCode: 200,
        body: 'Received'
    };
};
