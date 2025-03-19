import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { Photo } from './schemas/photo.schema';
import * as ffmpeg from 'fluent-ffmpeg';
import { Response } from 'express';
import * as fs from 'fs';

// Express dosyası için tip tanımı
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

@Controller()
export class PhotosController {
    constructor(private readonly photosService: PhotosService) { }

    private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['00:00:01'],
                    filename: thumbnailPath,
                    folder: './uploads',
                    size: '320x240'
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
    }

    @Post('albums/:albumId/photos')
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                // Unique isim oluşturma
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            // Resim ve video dosyalarına izin ver
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|ogg|mov)$/)) {
                return cb(new BadRequestException('Sadece resim ve video dosyaları yüklenebilir'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 60 * 1024 * 1024, // 60 MB limit
        },
    }))
    async uploadPhoto(
        @Param('albumId') albumId: string,
        @Body() createPhotoDto: CreatePhotoDto,
        @UploadedFile() file: MulterFile,
    ): Promise<Photo> {
        if (!file) {
            throw new BadRequestException('Lütfen bir fotoğraf veya video yükleyin');
        }

        // Dosya yolunu oluştur - Render'da çalışacak şekilde
        const baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://wedding-album-dfzw.onrender.com'
            : 'http://localhost:3001';
        const imagePath = `${baseUrl}/uploads/${file.filename}`;

        // Video mu kontrol et
        const isVideo = file.originalname.match(/\.(mp4|webm|ogg|mov)$/) ? true : false;

        // Eğer video ise önizleme görüntüsü oluştur
        let thumbnailFilename: string | null = null;
        if (isVideo) {
            try {
                thumbnailFilename = `thumb_${file.filename.split('.')[0]}.jpg`;
                await this.generateThumbnail(file.path, thumbnailFilename);
                console.log('Video önizleme oluşturuldu:', thumbnailFilename);
            } catch (error) {
                console.error('Video önizleme oluşturma hatası:', error);
            }
        }

        console.log('Yüklenen dosya:', {
            dosya_adi: file.originalname,
            mime_type: file.mimetype,
            is_video: isVideo,
            url: imagePath,
            thumbnail: thumbnailFilename
        });

        return this.photosService.create({
            ...createPhotoDto,
            album: albumId,
            isVideo,
            thumbnailPath: thumbnailFilename ? `${baseUrl}/uploads/${thumbnailFilename}` : undefined
        }, imagePath);
    }

    @Get('albums/:albumId/photos')
    async findByAlbumId(@Param('albumId') albumId: string): Promise<Photo[]> {
        return this.photosService.findByAlbumId(albumId);
    }

    @Get('photos/:id')
    async findOne(@Param('id') id: string): Promise<Photo> {
        return this.photosService.findOne(id);
    }

    @Delete('photos/:id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.photosService.remove(id);
    }
} 