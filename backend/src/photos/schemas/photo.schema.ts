import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Album } from '../../albums/schemas/album.schema';

export type PhotoDocument = Photo & Document;

@Schema({ timestamps: true })
export class Photo {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    imagePath: string;

    @Prop()
    thumbnailPath?: string;

    @Prop({ required: true })
    name: string;

    @Prop({ default: false })
    isVideo: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Album', required: true })
    album: Album;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo); 