export const loadImage = (src: string, onLoad: () => void, onError: () => void) => {
    const img = new Image();
    img.src = src;
    img.onload = onLoad;
    img.onerror = onError;
};

export const getImageSrcSet = (src: string, sizes: string[]) => {
    return sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');
};
