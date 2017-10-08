var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hello! My name is assignment bot.");
        session.beginDialog('addAssignment');
    }
]);

bot.recognizer(new builder.RegExpRecognizer("CancelIntent", { en_us: /^(cancel|nevermind)/i, ja_jp: /^(キャンセル)/ }));
bot.recognizer

bot.dialog('addAssignment', [
    function (session) {
        builder.Prompts.text(session, "Tell me the assigments or assessments that is due in future and I will keep track of them for you.");
    },
    function (session, results) {
        console.log(results.response);
        session.dialogData.currentAssignment = results.response;
        builder.Prompts.time(session, "And what is the due date for " + results.response);
    },
    function (session, results) {
        console.log(results.response);
        session.dialogData.currentDueDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.confirm(session, "The due date for " + session.dialogData.currentAssignment + " is " + session.dialogData.currentDueDate + ". Is that right?");
    },
    function (session, results) {
        console.log(results.response);
        if (results.response) {
            session.userData.assignments = session.userData.assignments || [];
            session.userData.assignments.push({
                assignmentName: session.dialogData.currentAssignment,
                assignmentDueDate: session.dialogData.currentDueDate
            });
            session.endDialog("The assignment has been added, you will be able to check all of your assignment, and you will receive a notice when the due date is near.");
        }
    }
]).triggerAction({ matches: /add/i });

bot.dialog('CancelDialog', function (session) {
    session.endConversation("Ok, I'm canceling your order.");
}).triggerAction({ matches: 'CancelIntent' });

bot.dialog('showAll', function (session) {
    var msg;
    var assignments = session.userData.assignments;
    if (assignments.length > 0) {
        msg = 'Below is your assignments and their due dates:'
        assignments.forEach(function (assignment) {
            msg += '\n* ' + assignment.assignmentName + ' ' + assignment.assignmentDueDate;
        })
    }else {
        msg = 'You don\'t have any assignments in my record at the moment try add some new one.'
    }
    session.endDialog(msg);
}).triggerAction({
    matches: /show all/i,
});