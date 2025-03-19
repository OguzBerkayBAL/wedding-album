export class CreatePhotoDto {
    title: string;
    name: string;
    album: string; // AlbumId
    isVideo?: boolean;
    thumbnailPath?: string;
} 