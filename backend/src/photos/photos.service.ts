import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlbumsService } from '../albums/albums.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class PhotosService {
    private readonly logger = new Logger(PhotosService.name);

    constructor(
        @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
        private readonly albumsService: AlbumsService,
    ) { }

    async create(
        createPhotoDto: CreatePhotoDto,
        imagePath: string,
    ): Promise<Photo> {
        // Albümün varlığını doğrula
        await this.albumsService.findOne(createPhotoDto.album);

        const createdPhoto = new this.photoModel({
            ...createPhotoDto,
            imagePath,
            isVideo: createPhotoDto.isVideo || false,
            thumbnailPath: createPhotoDto.thumbnailPath,
            uploadDate: new Date(),
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
            // Cloudinary'den dosyayı sil (eğer Cloudinary URL'si ise)
            if (photo.imagePath && photo.imagePath.includes('cloudinary.com')) {
                try {
                    // Cloudinary public_id'sini URL'den çıkar
                    const publicId = this.getPublicIdFromUrl(photo.imagePath);
                    if (publicId) {
                        const result = await cloudinary.uploader.destroy(publicId);
                        this.logger.log(`Cloudinary'den silindi: ${publicId}, sonuç: ${JSON.stringify(result)}`);
                    }
                } catch (error) {
                    this.logger.error(`Cloudinary silme hatası: ${error.message}`);
                }
            } else {
                // Eski tarz, lokal dosyaları sil
                this.deleteLocalFile(photo.imagePath);

                if (photo.isVideo && photo.thumbnailPath) {
                    this.deleteLocalFile(photo.thumbnailPath);
                }
            }

            // Veritabanından kaydı sil
            await this.photoModel.findByIdAndDelete(id).exec();
            return true;
        } catch (error) {
            this.logger.error(`Fotoğraf silme hatası: ${error.message}`);
            return false;
        }
    }

    // URL'den Cloudinary public_id çıkarma
    private getPublicIdFromUrl(url: string): string | null {
        try {
            // Örnek URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/wedding_photos/abcdef.jpg
            // public_id: wedding_photos/abcdef
            const regex = /\/v\d+\/(.+)\./;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            this.logger.error(`Public ID çıkarma hatası: ${error.message}`);
            return null;
        }
    }

    // Yerel dosyayı silme işlemi
    private deleteLocalFile(fileUrl: string): void {
        try {
            // URL'den dosya adını çıkar
            const urlParts = fileUrl.split('/');
            const filename = urlParts[urlParts.length - 1];

            if (!filename) return;

            const filePath = path.join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`Silinen dosya: ${filePath}`);
            }
        } catch (error) {
            this.logger.error(`Yerel dosya silme hatası: ${error.message}`);
        }
    }

    async removeByAlbumId(albumId: string): Promise<boolean> {
        try {
            const photos = await this.findByAlbumId(albumId);

            // Albümdeki tüm fotoğrafları sil
            for (const photo of photos) {
                // MongoDB belgesinden ID'yi doğru şekilde alma
                // TypeScript hatası giderme - _id kullanımı için tip dönüşümü
                const photoId = (photo as any)._id?.toString();
                if (photoId) {
                    await this.remove(photoId);
                } else {
                    this.logger.warn(`Photo ID bulunamadı: ${JSON.stringify(photo)}`);
                }
            }

            return true;
        } catch (error) {
            this.logger.error(`Albüm fotoğraflarını silme hatası: ${error.message}`);
            return false;
        }
    }
} 