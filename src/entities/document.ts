import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Template } from './template';
import { DocumentValue } from './document_values';

@Entity()
export class Document {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@ManyToOne(() => Template, template => template.linkedDocuments)
	template: Template;

	@OneToMany(() => DocumentValue, value => value.document)
	attributeFields: DocumentValue[];
}
