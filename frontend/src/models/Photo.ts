export interface Photo {
    _id?: string;
    title: string;
    imagePath: string;
    name: string;
    caption?: string;
    isVideo?: boolean;
    createdAt?: Date;
} 