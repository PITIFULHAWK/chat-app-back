import { connection, server, server as WebSocketServer } from "websocket";
import http from "http";
import {
  OutgoingMessage,
  SupportedMessage as OutgoingSupportedMessages,
} from "./messages/outgoingMessages";
import { IncomingMessage, SupportedMessage } from "./messages/incomingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/InMemoryStore";

const httpServer = http.createServer(function(request: any, response: any) {
  console.log(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

httpServer.listen(8080, function() {
  console.log(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer: httpServer,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false,
});

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on("request", function(request) {
  console.log("Inside connection");

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(
      new Date() + " Connection from origin " + request.origin + " rejected.",
    );
    return;
  }

  const connection = request.accept("echo-protocol", request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", function(message) {
    // TODO Add rate limiter logic here
    if (message.type === "utf8") {
      try {
        messageHandler(connection, JSON.parse(message.utf8Data));
      } catch (e) { }
      //console.log("Received Message: " + message.utf8Data);
      //connection.sendUTF(message.utf8Data);
    }
  });
});

function messageHandler(ws: connection, message: IncomingMessage) {
  if (message.type == SupportedMessage.JoinRoom) {
    const payload = message.payload;
    userManager.addUsers(payload.name, payload.roomId, payload.userId, ws);
  }

  if (message.type === SupportedMessage.SendMessage) {
    const payload = message.payload;
    const user = userManager.getUser(payload.roomId, payload.userId);

    if (!user) {
      console.error("User not found in the db");
      return;
    }
    let chat = store.addChat(
      payload.userId,
      payload.roomId,
      payload.message,
      user.name,
    );
    if (!chat) {
      return;
    }

    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessages.AddChat,
      payload: {
        chatId: chat.id,
        roomId: payload.roomId,
        message: payload.message,
        name: user.name,
        upvote: 0,
      },
    };
    userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
  }

  if (message.type === SupportedMessage.UpvoteMessage) {
    const payload = message.payload;
    const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
    if (!chat) {
      console.error("Failed to upvote chat");
      return;
    }
    console.log("inside upvote 2");

    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessages.UpdateChat,
      payload: {
        chatId: payload.chatId,
        roomId: payload.roomId,
        upvote: chat.upvote.length,
      },
    };
    console.log("inside upvote 3");
    userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
  }
}
