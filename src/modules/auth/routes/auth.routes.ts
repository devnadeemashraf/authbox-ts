import { type IRouter, Router } from 'express';

const authRouter: IRouter = Router();

// Routes will be added in subsequent commits:
// POST /register, POST /login, POST /logout, POST /refresh, etc.

export { authRouter };
