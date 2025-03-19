import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { Album, AlbumSchema } from './schemas/album.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Album.name, schema: AlbumSchema }]),
    ],
    controllers: [AlbumsController],
    providers: [AlbumsService],
    exports: [AlbumsService],
})
export class AlbumsModule { } 