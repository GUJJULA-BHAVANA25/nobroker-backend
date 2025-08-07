import express from 'express';
import { chatWithBot } from '../controllers/chat.controller';

const router = express.Router();

router.post('/chat', chatWithBot);

export default router;
