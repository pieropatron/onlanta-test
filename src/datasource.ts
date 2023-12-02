import { DataSource } from 'typeorm';
import { Template } from './entities/template';
import { Field } from './entities/field';
import { Document } from './entities/document';
import { DocumentValue } from './entities/document_values';
import 'dotenv/config';

export const dataSource = new DataSource({
	type: 'postgres',
	url: process.env.PG_URL,
	applicationName: process.env.APP_NAME || '',
	schema: 'Documents',
	entities: [Template, Field, Document, DocumentValue],
});
