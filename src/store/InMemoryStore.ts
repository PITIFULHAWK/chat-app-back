import { Chat, Store, UserId } from "./Store";
let globalChatId = 0;

export interface Room {
  roomId: string;
  chats: Chat[];
}

export class InMemoryStore implements Store {
  private store: Map<string, Room>;

  constructor() {
    this.store = new Map<string, Room>();
  }

  initRoom(roomId: string) {
    this.store.set(roomId, {
      roomId,
      chats: [],
    });
  }

  // last 50 chats => limit = 50, offset = 0
  // next 50 chats => limit = 50, offset = 50
  getChats(roomId: string, limit: number, offset: number) {
    const room = this.store.get(roomId);
    if (!room) {
      return [];
    }
    return room.chats
      .reverse()
      .slice(0, offset)
      .slice(-1 * limit);
  }

  addChat(userId: UserId, roomId: string, name: string, message: string) {
    if (!this.store.get(roomId)) {
      this.initRoom(roomId);
    }
    const room = this.store.get(roomId);
    if (!room) {
      return;
    }
    const chat = {
      id: (globalChatId++).toString(),
      userId,
      name,
      message,
      upvote: [],
    };
    room.chats.push(chat);
    return chat;
  }

  upvote(userId: UserId, roomId: string, chatId: string) {
    const room = this.store.get(roomId);
    if (!room) {
      return;
    }
    // TODO make this faster
    const chat = room.chats.find(({ id }) => id == chatId);

    if (chat) {
      if (chat.upvote.find((x) => x === userId)) {
        return chat;
      }
      chat.upvote.push(userId);
    }
    return chat;
  }
}
