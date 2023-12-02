import express, { Request } from 'express';
import { DataSource } from 'typeorm';
import { Document } from '../entities/document';
import { DocumentValue } from '../entities/document_values';
import { Template } from '../entities/template';
import { wrapHandler } from './_route_util';

export function getDocumentRouter(dataSource: DataSource) {
	const routerDocument = express.Router();
	const documentRepo = dataSource.getRepository(Document);
	const templateRepo = dataSource.getRepository(Template);

	routerDocument.get('/', wrapHandler(async (req, res) => {
		// no need to get relations in case of return list
		const documents = await documentRepo.find({
			where: {isdeleted: false}
		});
		res.json(documents);
	}));

	routerDocument.get('/:iddoc', wrapHandler(async (req: Request<{iddoc: string}>, res) => {
		// no need to get relations in case of return list
		const document = await documentRepo.findOne({
			where: {id: req.params.iddoc, isdeleted: false},
			relations: {
				attributeFields: {
					field: true
				},
				template: true
			}
		});

		if (!document) {
			return res.status(404).json({ message: `Document not found` });
		}

		res.json({
			id: document?.id,
			name: document.name,
			template: {
				id: document.template.id,
				name: document.template.name,
			},
			attributeFields: document.attributeFields.map(field => {
				const value = field.field.type === 'number' ? parseFloat(field.value as string) || null : field.value;

				return {
					name: field.field.name,
					value
				};
			})
		});
	}));

	routerDocument.post('/', wrapHandler(async (req, res) => {
		const body = req.body;

		const template = await templateRepo.findOne({
			where: { id: body.template.id },
		});
		if (!template) {
			return res.status(404).json({ message: `Template not found` });
		}

		const document: Document = new Document();

		const attributeFields: Record<string, Omit<DocumentValue, 'id'>> = template.attributeFields.reduce((memo, field) => {
			memo[field.name] = { field, document };
			return memo;
		}, {} as Record<string, Omit<DocumentValue, 'id'>>);

		for (const attributeFieldDoc of body.attributeFields) {
			const fieldName = attributeFieldDoc.name;
			const field = attributeFields[fieldName];
			if (!field) {
				return res.status(404).json({ message: `${fieldName} not found` });
			}
			field.value = attributeFieldDoc.value;
		}

		document.name = body.name;
		document.template = template;

		template.name = body.name;

		const queryRunner = dataSource.createQueryRunner();
		await queryRunner.startTransaction();
		try {
			await queryRunner.manager.insert(Document, document);
			await queryRunner.manager.insert(DocumentValue, Object.values(attributeFields));
			await queryRunner.commitTransaction();
			queryRunner.release();
		} catch (e) {
			await queryRunner.rollbackTransaction();
			queryRunner.release();
			throw e;
		}

		res.status(201).json({ message: 'document inserted' });
	}));

	routerDocument.put('/:iddoc', wrapHandler(async (req: Request<{ iddoc: string }>, res) => {
		const iddoc = req.params.iddoc;
		const document = await documentRepo.findOne({
			where: { id: iddoc, isdeleted: false },
			relations: {
				attributeFields: {
					document: true,
					field: true
				}
			}
		});

		if (!document) {
			return res.status(404).json({ message: `Document not found` });
		}

		const attributeFields: Record<string, DocumentValue> = document.attributeFields.reduce((memo, field) => {
			memo[field.field.name] = { id: field.id, field: field.field, document };
			return memo;
		}, {} as Record<string, DocumentValue>);

		const body = req.body;

		body.attributeFields.forEach(field => {
			const documentField = attributeFields[field.name];
			documentField.value = field.value;
		});

		const queryRunner = dataSource.createQueryRunner();
		await queryRunner.startTransaction();
		try {
			await Promise.all([
				queryRunner.manager.update(Document, { id: iddoc }, { name: body.name }),
				...Object.values(attributeFields).map(field => {
					return queryRunner.manager.update(DocumentValue, { id: field.id }, field);
				})
			]);
			await queryRunner.commitTransaction();
			queryRunner.release();
		} catch (e) {
			await queryRunner.rollbackTransaction();
			queryRunner.release();
			throw e;
		}

		res.status(200).json({ message: 'document updated' });
	}));

	routerDocument.delete('/:iddoc', wrapHandler(async (req: Request<{ iddoc: string }>, res) => {
		const iddoc = req.params.iddoc;
		const document = await documentRepo.findOne({
			select: {id: true},
			where: { id: iddoc, isdeleted: false },
		});

		if (!document) {
			return res.status(404).json({ message: `Document not found` });
		}
		document.isdeleted = true;
		const queryRunner = dataSource.createQueryRunner();
		await queryRunner.startTransaction();
		try {
			await queryRunner.manager.update(Document, {id: iddoc}, document);
			await queryRunner.commitTransaction();
			queryRunner.release();
		} catch (e) {
			await queryRunner.rollbackTransaction();
			queryRunner.release();
			throw e;
		}

		res.status(200).json({ message: 'document deleted' });
	}));

	return routerDocument;
}
