import express from "express";
import {
  addMessage,
  softDeleteMessages,
} from "../controllers/message.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:chatId", verifyToken, addMessage);

router.put("/soft-delete", verifyToken, softDeleteMessages);

export default router;
