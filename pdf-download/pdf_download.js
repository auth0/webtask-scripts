const mandrill = require('mandrill-api@1.0.45');

var mandrillClient;

// Max mails per second
const maxRate = 0.2;
const minDiff = 1000 / maxRate;

// More than 200 could trigger Webtask storage limits.
const maxSentSize = 200;

// Potential DoS: unbounded growth. Limited by call to checkDictionarySize;
var sent = {};

var debug = false;

/**
 * Webtask that registers an email and then sends a download PDF link for a blog
 * post.
 * @param {string} pdfId - the requested PDF's id.
 * @param {string} email - the user's email.
 * @param {string} name - the user's name.
 * @param {boolean} debug - print debugging info
 */
module.exports = function(context, cb) {
    debug = new Boolean(context.data.debug).valueOf();
    if(debug) {
        console.log('Debug mode enabled');
    }

    mandrillClient = new mandrill.Mandrill(context.data.MANDRILL_KEY);

    context.storage.get((error, data) => {
        if(data) {
            sent = data;

            //TODO: Don't do this! Generate one time links!
            const pdfUrl = `https://cdn.auth0.com/blog/pdf/${context.data.pdfId}.pdf`;

            sendEmail(context.data.email, context.data.name, pdfUrl, context.storage, cb);
        }
    });
}

function sendEmail(email, name, pdfUrl, storage, cb) {
    const now = Date.now();
    if(sent.hasOwnProperty(email)) {
        if(debug) {
            console.log('Email diff: ' + (now - sent[email]));
        }

        if((now - sent[email]) < minDiff) {
            if(debug) {
                console.log('Exceeded max mail rate, diff: ' + (now - sent[email]));
            }
            cb(new Error('Exceeded max mail rate'));
            return;
        }
    }

    const body = `<p><a href="${pdfUrl}">Click here</a> to get your PDF with extra content!</p>`;
    const message = {
        html: body,
        subject: 'Auth0 blog: PDF with extra content',
        from_email: 'no-reply@auth0.com',
        from_name: 'Auth0 Team',
        to: [{
            email: email,
            name: name,
            type: 'to'
        }],
    };

    mandrillClient.messages.send({
        message: message
    }, function(result) {
        if(result.status === 'rejected' || result.status === 'invalid') {
            cb(new Error('Invalid or rejected email address'));
        } else {
            checkDictionarySize();
            sent[email] = Date.now();

            if(debug) {
                console.log(JSON.stringify(sent));
            }

            storage.set(sent, (error) => {
                if(error) {
                    console.log('Error writing data, ignoring: ' + error);
                }
            });

            cb(null);
        }
    }, function(error) {
        cb(e);
    });
}

// Check the size of the sent dictionary. If too big, just keep the relevant
// entries for rate limiting.
function checkDictionarySize() {
    const keys = Object.keys(sent);
    if(keys.length >= maxSentSize) {
        var newSent = {};
        const now = Date.now();

        keys.forEach((k) => {
            if((now - sent[k]) < minDiff) {
                newSent[k] = sent[k];
            }
        });

        sent = newSent;

        if(debug) {
            console.log('Reduced dictionary size');
            console.log(JSON.stringify(sent));
        }
    }
}
