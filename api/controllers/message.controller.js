import prisma from "../lib/prisma.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: [tokenUserId],
        lastMessage: text,
      },
    });

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};

export const softDeleteMessages = async (req, res) => {
  const { messageIds } = req.body;
  const tokenUserId = req.userId;

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ message: "Message IDs are required." });
  }

  try {
    const messagesToDelete = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        userId: tokenUserId,
      },
    });

    if (messagesToDelete.length !== messageIds.length) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete one or more messages." });
    }

    const chatId = messagesToDelete[0]?.chatId;
    if (!chatId) {
      return res
        .status(400)
        .json({ message: "Chat not found for these messages." });
    }

    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        text: "This message was deleted",
      },
    });

    // --- FIND AND UPDATE THE CHAT'S LAST MESSAGE ---
    const newLastMessageRecord = await prisma.message.findFirst({
      where: { chatId: chatId },
      orderBy: { createdAt: "desc" },
    });

    const newLastMessageText = newLastMessageRecord
      ? newLastMessageRecord.text
      : "Chat started";

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessage: newLastMessageText },
    });

    res.status(200).json({
      message: "Messages deleted successfully.",
      newLastMessage: newLastMessageText, // Return the new last message
    });
  } catch (err) {
    console.error("Error during soft delete:", err);
    res.status(500).json({ message: "Failed to delete messages." });
  }
};
