import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Document } from './document';
import { Field } from './field';

@Entity()
export class DocumentValue {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({nullable:true})
	value?: string;

	@ManyToOne(() => Document, template => template.attributeFields)
	document: Document;

	@ManyToOne(() => Field, field => field.linkedValues)
	field: Field;
}
