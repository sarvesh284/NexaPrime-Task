import { Request, Response } from 'express';
import { isDbConnected } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

export class HealthController {
  static live(_req: Request, res: Response): void {
    sendSuccess(res, { status: 'ok', uptime: process.uptime() }, 'Service is live', 200);
  }

  static ready(_req: Request, res: Response): void {
    const dbOk = isDbConnected();
    if (dbOk) {
      sendSuccess(res, { status: 'ok', db: 'connected', uptime: process.uptime() }, 'Service is ready', 200);
    } else {
      sendError(res, 'Database connection is not ready', 503, 'SERVICE_UNAVAILABLE', { db: 'disconnected' });
    }
  }
}
