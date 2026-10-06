import type { Request, Response } from 'express';

export const postEmployeeDocuments = async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	response.sendStatus(501);
};
