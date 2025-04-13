import React from 'react';

interface AddPhotoButtonProps {
    onClick: () => void;
}

const AddPhotoButton: React.FC<AddPhotoButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 transition-all duration-300 hover:-translate-y-1 z-40"
        >
            <span className="text-xl">📷</span>
            Fotoğraf/Video Ekle
        </button>
    );
};

export default AddPhotoButton; 