import { DataSource } from 'typeorm';
import { Template } from './entities/template';
import { Field } from './entities/field';
import { Document } from './entities/document';
import { DocumentValue } from './entities/document_values';

export const dataSource = new DataSource({
	type: 'postgres',
	url: 'postgresql://postgres:postgres@127.0.0.1:5432/onlanta',
	applicationName: 'ONLANTA',
	schema: 'Documents',
	entities: [Template, Field, Document, DocumentValue],
	// synchronize: true,
});
