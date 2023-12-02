import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, Unique } from 'typeorm';
import { Field } from './field';
import { Document } from './document';

@Entity()
@Index(['name'], { unique: true })
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
