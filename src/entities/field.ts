import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Template } from './template';
import { DocumentValue } from './document_values';

export enum FieldType {
	string = 'string',
	date = 'date',
	number = 'number',
}

@Entity()
@Index(['template', 'name'], {unique: true})
export class Field {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@ManyToOne(() => Template, template => template.attributeFields)
	template: Template;

	@Column({
		type: 'enum',
		enum: FieldType,
	})
	type: FieldType;

	@OneToMany(() => DocumentValue, value => value.field)
	linkedValues: DocumentValue[];
}
