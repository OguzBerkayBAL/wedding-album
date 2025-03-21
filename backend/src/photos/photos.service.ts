import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlbumsService } from '../albums/albums.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotosService {
    constructor(
        @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
        private readonly albumsService: AlbumsService,
    ) { }

    async create(
        createPhotoDto: CreatePhotoDto,
        imagePath: string,
        imageData?: Buffer,
        thumbnailData?: Buffer,
        mimeType?: string
    ): Promise<Photo> {
        // Albümün varlığını doğrula
        await this.albumsService.findOne(createPhotoDto.album);

        const createdPhoto = new this.photoModel({
            ...createPhotoDto,
            imagePath,
            isVideo: createPhotoDto.isVideo || false,
            thumbnailPath: createPhotoDto.thumbnailPath,
            uploadDate: new Date(),
            imageData,
            thumbnailData,
            mimeType
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
            throw new NotFoundException(`Fotoğraf bulunamadı ID: ${id}`);
        }
        return photo;
    }

    async findByFilename(filename: string): Promise<Photo | null> {
        // imagePath veya thumbnailPath sonunda bu filename ile biten kayıtları bul
        const photos = await this.photoModel.find({
            $or: [
                { imagePath: { $regex: filename + '$' } },
                { thumbnailPath: { $regex: filename + '$' } }
            ]
        }).exec();

        return photos.length > 0 ? photos[0] : null;
    }

    async remove(id: string): Promise<boolean> {
        const photo = await this.findOne(id);
        if (!photo) {
            throw new NotFoundException(`Fotoğraf bulunamadı ID: ${id}`);
        }

        try {
            // Dosya yolundan sadece dosya adını çıkartma
            const getFilenameFromPath = (filePath: string): string => {
                // URL'den dosya adını çıkart
                const urlParts = filePath.split('/');
                return urlParts[urlParts.length - 1];
            };

            // Orijinal dosyayı sil
            const imageName = getFilenameFromPath(photo.imagePath);
            if (imageName) {
                const imagePath = path.join(process.cwd(), 'uploads', imageName);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`Silinen dosya: ${imagePath}`);
                } else {
                    console.log(`Dosya bulunamadı: ${imagePath}`);
                }
            }

            // Eğer video ise thumbnail'i de sil
            if (photo.isVideo && photo.thumbnailPath) {
                const thumbnailName = getFilenameFromPath(photo.thumbnailPath);
                if (thumbnailName) {
                    const thumbnailPath = path.join(process.cwd(), 'uploads', thumbnailName);
                    if (fs.existsSync(thumbnailPath)) {
                        fs.unlinkSync(thumbnailPath);
                        console.log(`Silinen thumbnail: ${thumbnailPath}`);
                    } else {
                        console.log(`Thumbnail bulunamadı: ${thumbnailPath}`);
                    }
                }
            }

            // Veritabanından kaydı sil
            await this.photoModel.findByIdAndDelete(id).exec();
            return true;
        } catch (error) {
            console.error(`Fotoğraf silme hatası: ${error.message}`);
            return false;
        }
    }

    async removeByAlbumId(albumId: string): Promise<boolean> {
        try {
            // Albümdeki tüm fotoğrafları bul
            const photos = await this.findByAlbumId(albumId);

            // Her bir fotoğrafı tek tek silmek için remove metodunu kullan
            for (const photo of photos) {
                await this.remove(photo.id);
            }

            return true;
        } catch (error) {
            console.error(`Albüm fotoğraflarını silme hatası: ${error.message}`);
            return false;
        }
    }
} 