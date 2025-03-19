import React, { useEffect, useState, useCallback } from 'react';

interface Heart {
    id: number;
    left: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
}

const FallingHearts: React.FC = () => {
    const [hearts, setHearts] = useState<Heart[]>([]);

    // Rastgele kalp oluştur
    const createHeart = useCallback((id: number): Heart => ({
        id,
        left: Math.random() * 100, // Rastgele yatay pozisyon (%)
        size: Math.random() * 20 + 10, // 10-30px arası boyut
        opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8 arası opaklık
        duration: Math.random() * 10 + 5, // 5-15s arası düşme süresi
        delay: Math.random() * 5, // 0-5s arası gecikme
    }), []);

    useEffect(() => {
        // Başlangıçta 25-30 arası kalp oluştur
        const heartCount = Math.floor(Math.random() * 6) + 25;
        const initialHearts = Array.from({ length: heartCount }, (_, i) => createHeart(i));
        setHearts(initialHearts);

        // Her 2 saniyede bir yeni kalp ekle ve eski kalpleri temizle
        const interval = setInterval(() => {
            setHearts(prev => {
                const newHeart = createHeart(Date.now());
                // Maksimum 80 kalp ile sınırla (performans için)
                const updatedHearts = [...prev, newHeart];
                if (updatedHearts.length > 80) {
                    return updatedHearts.slice(-80);
                }
                return updatedHearts;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [createHeart]);

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className="absolute text-pink-500 animate-fall"
                    style={{
                        left: `${heart.left}%`,
                        top: '-20px',
                        fontSize: `${heart.size}px`,
                        opacity: heart.opacity,
                        animation: `fall ${heart.duration}s linear ${heart.delay}s forwards`,
                    }}
                >
                    ❤️
                </div>
            ))}
        </div>
    );
};

export default FallingHearts; 