/**
 * Video dosyası olup olmadığını dosya path'inin uzantısına bakarak belirleyen fonksiyon
 * 
 * @param path - Kontrol edilecek dosya yolu (photoPath veya URL)
 * @returns Boolean - Video dosyası ise true, değilse false
 */
export const isVideo = (path: string): boolean => {
    if (!path) return false;

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lowercasePath = path.toLowerCase();

    return videoExtensions.some(ext => lowercasePath.endsWith(ext)) ||
        lowercasePath.includes('video');
}; 