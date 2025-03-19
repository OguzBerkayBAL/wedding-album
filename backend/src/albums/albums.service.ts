import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album, AlbumDocument } from './schemas/album.schema';

@Injectable()
export class AlbumsService {
    constructor(
        @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    ) { }

    async create(createAlbumDto: CreateAlbumDto): Promise<Album> {
        const createdAlbum = new this.albumModel(createAlbumDto);
        return createdAlbum.save();
    }

    async findAll(): Promise<Album[]> {
        return this.albumModel.find().exec();
    }

    async findOne(id: string): Promise<Album> {
        const album = await this.albumModel.findById(id).exec();
        if (!album) {
            throw new NotFoundException(`Album with ID "${id}" not found`);
        }
        return album;
    }

    async update(id: string, updateAlbumDto: UpdateAlbumDto): Promise<Album> {
        const updatedAlbum = await this.albumModel
            .findByIdAndUpdate(id, updateAlbumDto, { new: true })
            .exec();

        if (!updatedAlbum) {
            throw new NotFoundException(`Album with ID "${id}" not found`);
        }

        return updatedAlbum;
    }

    async remove(id: string): Promise<void> {
        const result = await this.albumModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Album with ID "${id}" not found`);
        }
    }
} 