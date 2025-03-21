import React from 'react';

interface LoadingSpinnerProps {
    text?: string;
    size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    text = 'Yükleniyor...',
    size = 'medium'
}) => {
    const getSizeClass = () => {
        switch (size) {
            case 'small':
                return 'w-5 h-5 border-2';
            case 'large':
                return 'w-12 h-12 border-4';
            case 'medium':
            default:
                return 'w-8 h-8 border-3';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div
                className={`${getSizeClass()} rounded-full border-primary border-t-transparent animate-spin mb-3`}
            />
            {text && <p className="text-gray-600">{text}</p>}
        </div>
    );
};

export default LoadingSpinner; 