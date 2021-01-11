function wss() {
//Creating a Web Socket server becomes easy because Web Socket API and the API of the node-web socket-server framework have helped us encapsulate it, just call it directly
//     The main thing is to create a Web Socket server and initialize some variables,
//     Set the server-side handling for various events.

//require("sys");
    let WebSocket = require('ws')
// Create a Web Socket server,
    let WebSocketServer = WebSocket.Server;
// Load some of the required node modules
    let chatLib = require("./public/javascripts/chatLib");
//Introduce the char Lib module,
// Introduces export objects
    let EVENT_TYPE = chatLib.EVENT_TYPE;
//Gets the type of user event
    let PORT = chatLib.PORT;
//Gets the listening port
    let wss = new WebSocketServer({
        port: PORT
    });
//Create a new web socket server with a listening port for PORT

// Define and initialize some variables,
    let zTool = require("./public/javascripts/zTool");
//The zTool module is introduced
    let onlineUserMap = new zTool.SimpleMap();
//Get information about the current list of online users
    let historyContent = new zTool.CircleList(100);
//Get the latest 100 current history chats messages
    let connCounter = 1;
    let uid = null;
    let mongoose = require('mongoose');

    mongoose.connect('mongodb://localhost:27017/chatroom');
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        // we're connected!
        console.log("db connection is OK");

    });

    let loginSchema = mongoose.Schema({
        uid: Number,
        nickName: String,
        loginDate: Date,
        logoutDate: Date
    })

    let historySchema = mongoose.Schema({
        uid: Number,
        nickName: String,
        time: Date,
        content: String
    })

    let loginUserModel = mongoose.model("loginUser", loginSchema);
    let historyModel = mongoose.model("history", historySchema);

    wss.on('connection', function (conn) {
//In the case of 'connection', if a message event occurs on the connection, the user may log in, chat, refresh the list of online users, and get the latest history.
        conn.on('message', function (message) {
            let mData = chatLib.analyzeMessageData(message);
            if (mData && mData.EVENT) {
                //Determine the user EVENT_TYPE, give the corresponding response.
                switch (mData.EVENT) {
                    case EVENT_TYPE.LOGIN:
                        // New user connection
                        uid = connCounter;
                        let newUser = {
                            'uid': connCounter,
                            'nick': chatLib.getMsgFirstDataValue(mData)
                        };
                        console.log('User:{\'uid\':' + newUser.uid + ',\'nickname\':' + newUser.nick + '}coming on protocol websocket draft ' + conn.protocolVersion);
                        console.log('current connecting counter: ' + wss.clients.size);
                        console.log(uid);
                        conn.uid = connCounter;
                        conn.nick = newUser.nick;
                        console.log('name:' + conn.uid);
                        // Add newly connected users to the list of online users
                        onlineUserMap.put(uid, newUser);

                        //save in db
                        let user = new loginUserModel({
                            uid: newUser.uid,
                            nickName: newUser.nick,
                            loginDate: Date.now(),
                            logoutDate: null
                        })
                        user.save(function (err, loginuser) {
                            if (err) return console.log(err);
                            console.log("data save ok")
                        })
                        conn.oId = user._id; //save MongoDb _id to client
                        //
                        console.log(onlineUserMap);
                        // Broadcast information about new users to online users
                        wss.clients.forEach(function (client) {
                            client.send(JSON.stringify({
                                'user': onlineUserMap.get(uid),
                                'event': EVENT_TYPE.LOGIN,
                                'values': [newUser],
                                'counter': connCounter
                            }))
                        });
                        connCounter++;
                        break;

                    case EVENT_TYPE.SPEAK:
                        // The user speaks something
                        let content = chatLib.getMsgSecondDataValue(mData);
                        //Synchronize user message
                        wss.clients.forEach(function (client) {
                            client.send(JSON.stringify({
                                'user': onlineUserMap.get(chatLib.getMsgFirstDataValue(mData)),
                                'event': EVENT_TYPE.SPEAK,
                                'values': [content]
                            }))
                        });
                        historyContent.add({
                            'user': onlineUserMap.get(conn.uid),
                            'content': content,
                            'time': new Date().getTime()
                        });
                        console.log("getUid:" + conn.uid);
                        console.log('nick:' + conn.nick);
                        //save in db
                        let history = new historyModel({
                            uid: conn.uid,
                            nickName: conn.nick,
                            time: new Date().getTime(),
                            content: chatLib.getMsgSecondDataValue(mData)
                        })
                        history.save(function (err, history) {
                            if (err) return console.log(err);
                            console.log("data save ok")
                        })
                        conn.oId = history._id; //save MongoDb _id to client
                        //
                        console.log(historyContent);
                        //
                        break;

                    case EVENT_TYPE.LIST_USER:
                        // Get the current online user
                        conn.send(JSON.stringify({
                            'user': onlineUserMap.get(uid),
                            'event': EVENT_TYPE.LIST_USER,
                            'values': onlineUserMap.values()
                        }));
                        break;

                    case EVENT_TYPE.LIST_HISTORY:
                        // Get the most recent chat history message
                        conn.send(JSON.stringify({
                            'user': onlineUserMap.get(uid),
                            'event': EVENT_TYPE.LIST_HISTORY,
                            'values': historyContent.values()
                        }));
                        break;

                    case EVENT_TYPE.ALL_HISTORY:
                        // Get all chat history message
                        conn.send(JSON.stringify({
                            'user': onlineUserMap.get(uid),
                            'event': EVENT_TYPE.ALL_HISTORY,
                            'values': historyContent.values()
                        }));
                        break;

                    default:
                        break;
                }

            } else {
                // There was an error with the event type.
                // Load and log,
                // Send an error message to the current user
                console.log('desc:message,userId:' + chatLib.getMsgFirstDataValue(mData) + ',message:' + message);
                conn.send(JSON.stringify({
                    'uid': chatLib.getMsgFirstDataValue(mData),
                    'event': EVENT_TYPE.ERROR
                }));
            }
        });
        //If the type of event is not a regular behavior
        // The system reported an error to the current user.
        conn.on('error', function () {
            console.log(Array.prototype.join.call(arguments, ", "));
        });
        // When the connection goes wrong and the user exits, also give a corresponding response
        conn.on('close', function () {
            // Remove from the list of online users
            //console.log(onlineUserMap);
            //console.log(conn.uid);
            let logoutUser = onlineUserMap.remove(conn.uid);
            //save in db
            // let user = new logoutUserModel({
            //     uid: logoutUser.uid,
            //     nickName: logoutUser.nick,
            //     logoutDate: Date.now()
            // })
            loginUserModel.findById(conn.oId, function (err, loginuser) {
                console.log(loginuser);
                if (err) {
                    console.log(err)
                } else {
                    if (loginuser) {
                        loginUserModel.updateOne(loginuser, {
                                logoutDate: Date.now()
                            },
                            function (err, model) {
                                if (err) console.log(err);
                            })
                    }
                }
            });

            //save history in db
            historyModel.findById(conn.oId, function (err, history) {
                //console.log(history);
                if (err) {
                    console.log(err)
                } else {
                    if (history) {
                        historyModel.updateOne(history, function (err, model) {
                            if (err) console.log(err);
                        })
                    }
                }
            });
            // user.save(function (err, loginUser) {
            //     if (err) return console.log(err);
            //     console.log("data save ok")
            // })
            //
            console.log(onlineUserMap);
            console.log(logoutUser);
            wss.clients.forEach(function (client) {
                if (client !== conn && client.readyState === WebSocket.OPEN) {
                    console.log('logoutUid:' + conn.uid);
                    client.send(JSON.stringify({
                        'uid': conn.uid,
                        'event': EVENT_TYPE.LOGOUT,
                        'values': [logoutUser]
                    }));
                }

            })
            console.log('User:{\'uid\':' + logoutUser.uid + ',\'nickname\':' + logoutUser.nick + '} has left.');
            console.log('current connecting counter: ' + wss.clients.size);
        });
    });
    console.log('Start listening on port ' + PORT);

}

module.exports = wss;
