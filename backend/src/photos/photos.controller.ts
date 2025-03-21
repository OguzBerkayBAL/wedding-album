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
    StreamableFile,
    Logger
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
    private readonly logger = new Logger(PhotosController.name);

    constructor(private readonly photosService: PhotosService) {
        // Uploads klasörünün varlığını kontrol et
        const uploadsDir = join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            this.logger.log(`Uploads klasörü oluşturuldu: ${uploadsDir}`);
        } else {
            this.logger.log(`Uploads klasörü mevcut: ${uploadsDir}`);
            // İzinleri kontrol et
            try {
                fs.accessSync(uploadsDir, fs.constants.W_OK);
                this.logger.log('Uploads klasörüne yazma izni var');
            } catch (err) {
                this.logger.error(`Uploads klasörüne yazma izni yok: ${err.message}`);
            }
        }
    }

    private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
        this.logger.log(`Video önizleme oluşturuluyor: ${videoPath} -> ${thumbnailPath}`);
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['00:00:01'],
                    filename: thumbnailPath,
                    folder: './uploads',
                    size: '320x240'
                })
                .on('end', () => {
                    this.logger.log('Video önizleme oluşturuldu');
                    resolve();
                })
                .on('error', (err) => {
                    this.logger.error(`Video önizleme oluşturma hatası: ${err.message}`);
                    reject(err);
                });
        });
    }

    // Dosyanın varlığını kontrol eden helper fonksiyon
    private async ensureFileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch (error) {
            this.logger.error(`Dosya bulunamadı: ${filePath}, hata: ${error.message}`);
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
                const fileName = `${randomName}${extname(file.originalname)}`;
                console.log(`Oluşturulan dosya adı: ${fileName}`);
                return cb(null, fileName);
            },
        }),
        fileFilter: (req, file, cb) => {
            // Resim ve video dosyalarına izin ver
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|ogg|mov)$/)) {
                return cb(new BadRequestException('Sadece resim ve video dosyaları yüklenebilir'), false);
            }
            console.log(`Dosya kabul edildi: ${file.originalname}, mimetype: ${file.mimetype}`);
            cb(null, true);
        },
        limits: {
            fileSize: 60 * 1024 * 1024, // 60 MB limit
        },
    }))
    async uploadPhoto(
        @Param('albumId') albumId: string,
        @Body() createPhotoDto: CreatePhotoDto,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Photo> {
        if (!file) {
            throw new BadRequestException('Lütfen bir fotoğraf veya video yükleyin');
        }

        try {
            this.logger.log(`Dosya yüklendi: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);
            this.logger.log(`Dosya dizini: ${file.destination}, dosya yolu: ${file.path}`);

            // Dosyanın gerçekten var olduğundan emin olalım
            const fileExists = await this.ensureFileExists(file.path);
            if (!fileExists) {
                throw new BadRequestException('Dosya yüklenirken bir sorun oluştu, dosya bulunamadı');
            }

            // Uploads klasörünün varlığını kontrol et ve izinleri düzelt
            const uploadsDir = join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
                this.logger.log(`Uploads klasörü oluşturuldu: ${uploadsDir}`);
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
                    this.logger.log(`Dosya (${fileSizeInMB.toFixed(2)}MB) veritabanına kaydedilecek`);
                } else {
                    this.logger.log(`Dosya çok büyük (${fileSizeInMB.toFixed(2)}MB), sadece dosya sisteminde saklanacak`);
                }
            } catch (error) {
                this.logger.error(`Dosya okuma hatası: ${error.message}`);
            }

            // Eğer video ise önizleme görüntüsü oluştur
            let thumbnailFilename: string | null = null;
            let thumbnailData: Buffer | undefined = undefined;
            if (isVideo) {
                try {
                    thumbnailFilename = `thumb_${file.filename.split('.')[0]}.jpg`;
                    await this.generateThumbnail(file.path, thumbnailFilename);
                    this.logger.log('Video önizleme oluşturuldu:', thumbnailFilename);

                    // Thumbnail içeriğini oku
                    const thumbnailPath = path.join('./uploads', thumbnailFilename);
                    if (await this.ensureFileExists(thumbnailPath)) {
                        thumbnailData = await fs.promises.readFile(thumbnailPath);
                    }
                } catch (error) {
                    this.logger.error(`Video önizleme oluşturma hatası: ${error.message}`);
                }
            }

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
                this.logger.error(`Dosya izinleri ayarlanırken hata: ${error.message}`);
            }

            this.logger.log(`PhotosService.create çağrılıyor: ${albumId}, ${imagePath}`);

            return this.photosService.create({
                ...createPhotoDto,
                album: albumId,
                isVideo,
                thumbnailPath: thumbnailFilename ? `${baseUrl}/uploads/${thumbnailFilename}` : undefined
            }, imagePath, imageData, thumbnailData, file.mimetype);
        } catch (error) {
            this.logger.error(`Dosya yükleme hatası: ${error.message}`);
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