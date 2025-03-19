import { CreateAlbumDto } from './create-album.dto';

export class UpdateAlbumDto implements Partial<CreateAlbumDto> {
    title?: string;
    date?: string;
    couple?: {
        name1: string;
        name2: string;
    };
    coverImage?: string;
    description?: string;
} 