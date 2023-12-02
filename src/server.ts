import express from 'express';
import { Logger } from '@pieropatron/tinylogger';
import {ValidationError} from '@hapi/joi';

import { dataSource } from './datasource';
import { getTemplateRouter } from './routes/template';
import { getDocumentRouter } from './routes/documents';
import 'dotenv/config';

const logger = new Logger(process.env.APP_NAME || 'app');
logger.level = 'debug';

const startApp = async () => {
	await dataSource.initialize();
	const app = express();
	app.use(express.json());
	app.use('/templates', getTemplateRouter(dataSource));
	app.use('/documents', getDocumentRouter(dataSource));

	const APP_PORT = parseInt(process.env.APP_PORT || '') || 3000;

	app.listen(APP_PORT, 'localhost', () => {
		logger.info(`server listen on port`, APP_PORT);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((error: Error, req, res, next) => {
		if (error) {
			if (error instanceof ValidationError){
				return res.status(400).json({
					error: 'Validation error',
					details: error.details
						.map(detail => detail.message)
						.filter(message => !!message)
				});
			}
			try {
				logger.error(error);
				res.status(500).json({ error: 'Internal server error' });
			} catch (e) {
				logger.error(`final express error`, e);
			}
		}
	});
};

const timeStart = logger.time('init');
startApp()
	.then(() => {
		timeStart();
	})
	.catch(e => {
		timeStart();
		logger.fatal(e);
		process.exit(1);
	});
