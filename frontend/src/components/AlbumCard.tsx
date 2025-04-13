import React from 'react';
import { Album } from '../models/Album';
import { Link } from 'react-router-dom';

interface AlbumCardProps {
    album: Album;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
    return (
        <Link
            to={`/album/${album._id}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
        >
            <div className="h-48 relative">
                {album.coverImage ? (
                    <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400">Kapak fotoğrafı yok</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{album.title}</h3>
                <p className="text-sm text-gray-500">
                    Düğün Albümü
                </p>
            </div>
        </Link>
    );
};

export default AlbumCard; 