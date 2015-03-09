return function (context, callback) {
    console.log('GitHub web hook fired!', context.webhook);
    callback(null, 'Done');
} 