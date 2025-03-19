import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlbumDocument = Album & Document;

@Schema({ timestamps: true })
export class Album {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    date: string;

    @Prop({
        required: true,
        type: {
            name1: { type: String, required: true },
            name2: { type: String, required: true },
        },
    })
    couple: {
        name1: string;
        name2: string;
    };

    @Prop()
    coverImage?: string;

    @Prop()
    description?: string;
}

export const AlbumSchema = SchemaFactory.createForClass(Album); 