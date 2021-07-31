exports.handler = async event => {
    console.log('handled!');

    return {
        statusCode: 200,
        body: 'Connected'
    };
};
