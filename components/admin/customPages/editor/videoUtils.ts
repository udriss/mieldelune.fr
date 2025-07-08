// Fonction pour extraire l'ID d'une vidéo YouTube
export function getYouTubeVideoId(url: string): string | null {
  const regexs = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const regex of regexs) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
}

// Fonction pour extraire l'ID d'une vidéo Vimeo
export function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

// Fonction pour obtenir l'URL d'embed d'une vidéo
export function getVideoEmbedUrl(url: string): string | null {
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }
  
  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  
  // Si ce n'est ni YouTube ni Vimeo, retourner l'URL originale
  return url;
}
