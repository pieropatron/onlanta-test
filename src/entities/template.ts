import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Field } from './field';
import { Document } from './document';

@Entity()
export class Template {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@OneToMany(() => Field, field => field.template)
	attributeFields: Field[];

	@OneToMany(() => Document, doc => doc.template)
	linkedDocuments: Document[];
}
