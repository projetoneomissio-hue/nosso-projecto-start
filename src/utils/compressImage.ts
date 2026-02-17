import imageCompression from 'browser-image-compression';

export async function compressImage(file: File) {
    const options = {
        maxSizeMB: 0.5, // Max size 0.5MB
        maxWidthOrHeight: 1024, // Max width/height
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Erro ao comprimir imagem:", error);
        return file; // Return original if compression fails
    }
}
