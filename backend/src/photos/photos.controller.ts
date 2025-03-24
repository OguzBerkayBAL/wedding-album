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
    Res,
    Logger,
    InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { Photo } from './schemas/photo.schema';
import * as ffmpeg from 'fluent-ffmpeg';
import { Response } from 'express';
import * as fs from 'fs';
import { photoStorage } from '../config/cloudinary.config';
import { v2 as cloudinary } from 'cloudinary';

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
    private readonly logger = new Logger(PhotosController.name);

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
        storage: photoStorage,
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
        @UploadedFile() file: any,
    ): Promise<Photo> {
        if (!file) {
            throw new BadRequestException('Lütfen bir fotoğraf veya video yükleyin');
        }

        try {
            // Daha detaylı log ekle
            this.logger.log(`Dosya yükleme isteği: albumId=${albumId}, file.originalname=${file.originalname}`);

            // Cloudinary konfigürasyon kontrolü
            this.logger.log('Cloudinary config kontrolü:');
            this.logger.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Mevcut' : 'Yok'}`);
            this.logger.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Mevcut' : 'Yok'}`);
            this.logger.log(`CLOUDINARY_URL: ${process.env.CLOUDINARY_URL ? 'Mevcut' : 'Yok'}`);

            this.logger.log(`Cloudinary'ye yüklenen dosya: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);

            // Tam dosya içeriğini loglama
            this.logger.log('Dosya detayları:', JSON.stringify(file, null, 2));

            // Cloudinary'den dönen URL'yi kullan
            const cloudinaryUrl = file.path;
            this.logger.log(`Cloudinary URL: ${cloudinaryUrl}`);

            // Video mu kontrol et
            const isVideo = file.originalname.match(/\.(mp4|webm|ogg|mov)$/) ? true : false;

            // Eğer video ise Cloudinary'nin otomatik oluşturduğu thumbnail URL'yi al
            let thumbnailPath = undefined;
            if (isVideo) {
                // Video thumbnail URL'si oluştur
                thumbnailPath = cloudinaryUrl.replace(/\.[^.]+$/, '.jpg');
                this.logger.log(`Video thumbnail URL: ${thumbnailPath}`);
            }

            this.logger.log(`PhotosService.create çağrılıyor: ${albumId}, ${cloudinaryUrl}`);

            // Fotoğrafı veritabanına kaydet
            return this.photosService.create({
                ...createPhotoDto,
                album: albumId,
                isVideo,
                thumbnailPath
            }, cloudinaryUrl);
        } catch (error) {
            // Hata detaylarını loglama
            this.logger.error(`Dosya yükleme hatası: ${error.message}`);
            this.logger.error(`Hata stack: ${error.stack}`);

            if (error.code === 'ENOENT') {
                this.logger.error('Dosya veya dizin bulunamadı hatası oluştu');
            }

            // Hata ile ilgili ek bilgiler
            if (error.response) {
                this.logger.error(`API Yanıt Hatası: ${JSON.stringify(error.response.data)}`);
            }

            throw new InternalServerErrorException(`Dosya yüklenirken bir sorun oluştu: ${error.message}`);
        }
    }

    @Get('albums/:albumId/photos')
    async findAll(@Param('albumId') albumId: string): Promise<Photo[]> {
        return this.photosService.findByAlbumId(albumId);
    }

    @Get('photos/album/:albumId')
    async findByAlbumId(@Param('albumId') albumId: string): Promise<Photo[]> {
        return this.photosService.findByAlbumId(albumId);
    }

    @Get('photos/:id')
    async findOne(@Param('id') id: string): Promise<Photo> {
        return this.photosService.findOne(id);
    }

    @Delete('photos/:id')
    async remove(@Param('id') id: string): Promise<boolean> {
        return this.photosService.remove(id);
    }

    @Get('uploads/:filename')
    async serveUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Önce veritabanında bu dosya adını kontrol et
            const photo = await this.photosService.findByFilename(filename);

            if (photo) {
                // Eğer Cloudinary URL'si varsa, oraya yönlendir
                if (photo.imagePath && photo.imagePath.includes('cloudinary.com')) {
                    return res.redirect(photo.imagePath);
                }

                // Eğer thumbnail isteniyorsa ve thumbnailPath varsa
                if (filename.startsWith('thumb_') && photo.thumbnailPath) {
                    return res.redirect(photo.thumbnailPath);
                }
            }

            // Eski yüklenen dosyalar için geriye dönük uyumluluk
            const file = join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(file)) {
                return res.sendFile(file);
            }

            // Dosya bulunamadı
            return res.status(404).json({
                message: 'Dosya bulunamadı',
                filename: filename
            });
        } catch (error) {
            this.logger.error(`Dosya servis hatası: ${error.message}`);
            return res.status(500).json({
                message: 'Dosya servis edilirken bir hata oluştu',
                error: error.message
            });
        }
    }
} 