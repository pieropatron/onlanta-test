import express from 'express';
import { Logger } from '@pieropatron/tinylogger';

import { dataSource } from './datasource';
import { getTemplateRouter } from './routes/template';

const logger = new Logger('ONLANTA');
logger.level = 'debug';

const startApp = async () => {
	await dataSource.initialize();
	const app = express();
	app.use(express.json());
	app.use('/templates', getTemplateRouter(dataSource));

	app.listen(3000, 'localhost', () => {
		logger.info(`server listen on port`, 3000);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((error: Error, req, res, next) => {
		if (error) {
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
