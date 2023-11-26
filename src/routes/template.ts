import express from 'express';
import { DataSource } from 'typeorm';
import { Template } from '../entities/template';
import { Field } from '../entities/field';
import { wrapHandler } from './_route_util';

export function getTemplateRouter(dataSource: DataSource) {
	const routerTemplate = express.Router();
	const templateRepo = dataSource.getRepository(Template);

	routerTemplate.get('/', wrapHandler(async (req, res) => {
		const templates = await templateRepo.find({
			relations: {attributeFields: true}
		});
		res.json(templates);
	}));

	routerTemplate.post('/', wrapHandler(async (req, res) => {
		const body = req.body;
		const queryRunner = dataSource.createQueryRunner();
		const template: Template = new Template();

		template.name = body.name;

		const attributeFields: Field[] = body.attributeFields.map(attributeField => {
			const field = new Field();
			field.template = template;
			field.type = attributeField.type;
			field.name = attributeField.name;
			return field;
		});

		await queryRunner.startTransaction();
		try {
			await queryRunner.manager.insert(Template, template);
			await queryRunner.manager.insert(Field, attributeFields);
			await queryRunner.commitTransaction();
		} catch (e){
			await queryRunner.rollbackTransaction();
		} finally {
			queryRunner.release();
		}

		res.status(201).json({message: 'template inserted'});
	}));

	return routerTemplate;
}
