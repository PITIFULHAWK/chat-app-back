export enum SupportedMessage {
  AddChat = "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
}

type MessagePayload = {
  roomId: string;
  message: string;
  name: string;
  upvote: number;
  chatId: string;
};

export type OutgoingMessage =
  | {
    type: SupportedMessage.AddChat;
    payload: MessagePayload;
  }
  | {
    type: SupportedMessage.UpdateChat;
    payload: MessagePayload;
  };
