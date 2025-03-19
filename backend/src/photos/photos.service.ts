import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlbumsService } from '../albums/albums.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { Photo, PhotoDocument } from './schemas/photo.schema';

@Injectable()
export class PhotosService {
    constructor(
        @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
        private readonly albumsService: AlbumsService,
    ) { }

    async create(createPhotoDto: CreatePhotoDto, imagePath: string): Promise<Photo> {
        // Albümün varlığını doğrula
        await this.albumsService.findOne(createPhotoDto.album);

        const createdPhoto = new this.photoModel({
            ...createPhotoDto,
            imagePath,
            isVideo: createPhotoDto.isVideo || false,
            thumbnailPath: createPhotoDto.thumbnailPath
        });
        return createdPhoto.save();
    }

    async findAll(): Promise<Photo[]> {
        return this.photoModel.find().exec();
    }

    async findByAlbumId(albumId: string): Promise<Photo[]> {
        return this.photoModel.find({ album: albumId }).exec();
    }

    async findOne(id: string): Promise<Photo> {
        const photo = await this.photoModel.findById(id).exec();
        if (!photo) {
            throw new NotFoundException(`Photo with ID "${id}" not found`);
        }
        return photo;
    }

    async remove(id: string): Promise<void> {
        const result = await this.photoModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Photo with ID "${id}" not found`);
        }
    }
} 