import express from 'express';
import { DataSource } from 'typeorm';
import Joi from '@hapi/joi';
import { Template } from '../entities/template';
import { Field, FieldType } from '../entities/field';
import { wrapHandler } from './_route_util';

const templateSchema = Joi.object({
	name: Joi.string(),
	attributeFields: Joi.array().items(
		Joi.object({
			name: Joi.string().min(1),
			type: Joi.string().valid(...Object.keys(FieldType))
		})
	).unique().items(field => field.name)
});

type templateBody = {
	name: string;
	attributeFields: {
		name: string,
		type: FieldType,
	}[];
};

export function getTemplateRouter(dataSource: DataSource) {
	const routerTemplate = express.Router();
	const templateRepo = dataSource.getRepository(Template);

	routerTemplate.get('/', wrapHandler(async (req, res) => {
		const templates = await templateRepo.find({
			relations: { attributeFields: true }
		});
		res.json(templates);
	}));

	routerTemplate.post('/', wrapHandler(async (req, res) => {
		const body: templateBody = await templateSchema.validateAsync(req.body || {});
		const queryRunner = dataSource.createQueryRunner();
		const template: Template = new Template();

		const double = await templateRepo.findOne({where: {name: body.name}});
		if (double){
			return res.status(400).json({ error: `Template "${body.name}" already exists`});
		}

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
			queryRunner.release();
		} catch (e) {
			await queryRunner.rollbackTransaction();
			queryRunner.release();
			throw e;
		}

		res.status(201).json({ message: 'template inserted' });
	}));

	return routerTemplate;
}
