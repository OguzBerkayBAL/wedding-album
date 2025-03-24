import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhotoDto {
    @IsString()
    @IsNotEmpty({ message: 'Başlık zorunludur' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'İsim zorunludur' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Albüm ID zorunludur' })
    album: string; // AlbumId

    @IsOptional()
    @IsBoolean()
    isVideo?: boolean;

    @IsOptional()
    @IsString()
    thumbnailPath?: string;
} 