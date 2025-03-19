export interface Album {
    _id?: string;
    title: string;
    date: string;
    couple: {
        name1: string;
        name2: string;
    };
    coverImage?: string;
    description?: string;
    createdAt?: Date;
} 