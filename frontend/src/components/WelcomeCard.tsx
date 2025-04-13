import React from 'react';

const WelcomeCard: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-10 md:p-12 shadow-lg relative overflow-hidden border border-pink-100">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full opacity-70 transform translate-x-16 -translate-y-16 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-100 rounded-full opacity-70 transform -translate-x-16 translate-y-16 blur-xl"></div>

            {/* Kalp Süslemeleri */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                {[...Array(20)].map((_, index) => (
                    <div
                        key={index}
                        className="absolute text-pink-500"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 16 + 10}px`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                        }}
                    >
                        ❤
                    </div>
                ))}
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6 relative z-10">
                Düğünümüze<br />
                <span className="text-pink-600">Hoş Geldiniz</span>
            </h2>

            <p className="text-gray-700 leading-relaxed mb-8 max-w-lg mx-auto relative z-10">
                Hayatımızın en özel gününde bizlerle olmanızdan mutluluk duyuyoruz. <br />
                Ömürlük birlikteliğimizin ilk çektiğiniz anılarınızı da burada paylaşabilirsiniz.
            </p>
        </div>
    );
};

export default WelcomeCard; 