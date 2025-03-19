import axios from 'axios';

// API URLini tanımla
const API_URL = 'https://backend-l33bui0im-oguzberkays-projects.vercel.app/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        // Tüm isteklerde kimlik doğrulama header'ı
        'Authorization': 'Bearer sampleapikey123' // Güvenlik için gerçek bir API anahtarı ile değiştirilmeli
    },
    // CORS ile ilgili ayarlar
    withCredentials: false,
});

// Hata yakalama interceptor'u
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Hatası:', error);
        return Promise.reject(error);
    }
);

export default api; 