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
    InternalServerErrorException,
    StreamableFile
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
import * as path from 'path';

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

    // Dosyanın varlığını kontrol eden helper fonksiyon
    private async ensureFileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
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

        try {
            // Dosyanın gerçekten var olduğundan emin olalım
            const fileExists = await this.ensureFileExists(file.path);
            if (!fileExists) {
                throw new BadRequestException('Dosya yüklenirken bir sorun oluştu');
            }

            // Dosya yolunu oluştur - Render'da çalışacak şekilde
            const baseUrl = process.env.NODE_ENV === 'production'
                ? 'https://wedding-album-dfzw.onrender.com'
                : 'http://localhost:3001';
            const imagePath = `${baseUrl}/uploads/${file.filename}`;

            // Video mu kontrol et
            const isVideo = file.originalname.match(/\.(mp4|webm|ogg|mov)$/) ? true : false;

            // Dosya içeriğini oku (tüm dosya tipleri için)
            let imageData: Buffer | undefined = undefined;
            try {
                const stats = await fs.promises.stat(file.path);
                const fileSizeInMB = stats.size / (1024 * 1024);

                // Dosya boyutu 40MB'dan küçükse veritabanına kaydet
                if (fileSizeInMB <= 40) {
                    imageData = await fs.promises.readFile(file.path);
                    console.log(`Dosya (${fileSizeInMB.toFixed(2)}MB) veritabanına kaydedilecek`);
                } else {
                    console.log(`Dosya çok büyük (${fileSizeInMB.toFixed(2)}MB), sadece dosya sisteminde saklanacak`);
                }
            } catch (error) {
                console.error('Dosya okuma hatası:', error);
            }

            // Eğer video ise önizleme görüntüsü oluştur
            let thumbnailFilename: string | null = null;
            let thumbnailData: Buffer | undefined = undefined;
            if (isVideo) {
                try {
                    thumbnailFilename = `thumb_${file.filename.split('.')[0]}.jpg`;
                    await this.generateThumbnail(file.path, thumbnailFilename);
                    console.log('Video önizleme oluşturuldu:', thumbnailFilename);

                    // Thumbnail içeriğini oku
                    const thumbnailPath = path.join('./uploads', thumbnailFilename);
                    if (await this.ensureFileExists(thumbnailPath)) {
                        thumbnailData = await fs.promises.readFile(thumbnailPath);
                    }
                } catch (error) {
                    console.error('Video önizleme oluşturma hatası:', error);
                }
            }

            console.log('Yüklenen dosya:', {
                dosya_adi: file.originalname,
                mime_type: file.mimetype,
                is_video: isVideo,
                dosya_boyutu: file.size,
                dosya_yolu: file.path,
                url: imagePath,
                thumbnail: thumbnailFilename,
                veritabaninda_saklanacak: imageData !== undefined
            });

            // Yüklenen dosyayı verilen izinleri kontrol edelim ve düzeltelim
            try {
                await fs.promises.chmod(file.path, 0o644);
                if (thumbnailFilename) {
                    const thumbPath = path.join('./uploads', thumbnailFilename);
                    if (await this.ensureFileExists(thumbPath)) {
                        await fs.promises.chmod(thumbPath, 0o644);
                    }
                }
            } catch (error) {
                console.error('Dosya izinleri ayarlanırken hata:', error);
            }

            return this.photosService.create({
                ...createPhotoDto,
                album: albumId,
                isVideo,
                thumbnailPath: thumbnailFilename ? `${baseUrl}/uploads/${thumbnailFilename}` : undefined
            }, imagePath, imageData, thumbnailData, file.mimetype);
        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            throw new InternalServerErrorException('Dosya yüklenirken bir sorun oluştu');
        }
    }

    @Get('uploads/:filename')
    async serveUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Önce dosya sisteminde kontrol et
            const file = join(process.cwd(), 'uploads', filename);

            // Dosyanın var olup olmadığını kontrol et
            const fileExists = await this.ensureFileExists(file);
            if (fileExists) {
                return res.sendFile(file);
            }

            // Dosya sisteminde bulunamadıysa veritabanından getir
            // Bu bir thumbnail resmi mi kontrol et
            const isThumb = filename.startsWith('thumb_');

            // Thumbnail ise orijinal dosya adından ID'yi bul
            // Değilse doğrudan dosya adından ID'yi bul
            let photo;

            try {
                // Dosya adı örneği: 7b90d2bca833861ce4d21974b61b38cb.mp4
                // veya thumb_7b90d2bca833861ce4d21974b61b38cb.jpg
                const baseFilename = isThumb
                    ? filename.substring(6).split('.')[0] // thumb_ kısmını çıkar
                    : filename.split('.')[0];

                // Dosya adına göre (filename) fotoğraf bul
                // Önce veritabanında filename ile eşleşen veriyi bul
                photo = await this.photosService.findByFilename(filename);

                if (!photo && baseFilename) {
                    // Bulunamadıysa başka bir şekilde ara
                    const photos = await this.photosService.findAll();
                    photo = photos.find(p => {
                        // URL'deki filename'i kontrol et
                        const pFilename = p.imagePath.split('/').pop();
                        const pThumbname = p.thumbnailPath ? p.thumbnailPath.split('/').pop() : null;

                        return pFilename === filename || pThumbname === filename;
                    });
                }
            } catch (error) {
                console.error('Dosya adı ile fotoğraf arama hatası:', error);
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'Dosya bulunamadı',
                    filename: filename
                });
            }

            // Thumbnail isteniyorsa ve veritabanında thumbnail varsa gönder
            if (isThumb && photo.thumbnailData) {
                res.setHeader('Content-Type', 'image/jpeg');
                return res.send(photo.thumbnailData);
            }

            // Normal dosya isteniyorsa ve veritabanında dosya varsa gönder
            if (!isThumb && photo.imageData) {
                res.setHeader('Content-Type', photo.mimeType || 'application/octet-stream');
                return res.send(photo.imageData);
            }

            // Veritabanında da yoksa 404 döndür
            return res.status(404).json({
                message: 'Dosya bulunamadı (veritabanında da yok)',
                filename: filename
            });

        } catch (error) {
            console.error('Dosya servis edilirken hata:', error);
            return res.status(500).json({
                message: 'Dosya servis edilirken bir hata oluştu',
                error: error.message
            });
        }
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
    async remove(@Param('id') id: string): Promise<boolean> {
        return this.photosService.remove(id);
    }
} 