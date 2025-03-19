import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlbumsModule } from '../albums/albums.module';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { Photo, PhotoSchema } from './schemas/photo.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
        AlbumsModule,
    ],
    controllers: [PhotosController],
    providers: [PhotosService],
})
export class PhotosModule { } 