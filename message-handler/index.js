exports.handler = async event => {

    const postData = JSON.parse(event.body).data;

    console.log(`received: ${postData}`);

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
