import { Request, Response } from 'express';
export const wrapHandler = (hanlerFn: (req: Request, res: Response) => Promise<Response | void>) => {
	return async (req: Request, res: Response, next) => {
		try {
			await hanlerFn(req, res);
		} catch (e) {
			next(e);
		}
	};
};
