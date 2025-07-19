
// ICI

export interface Profile {
  socialUrl: string;
  artistName: string;
  subTitle: string;
  imageUrl: string;
  imagetype: 'profileLink' | 'profileStorage';
  description: string;
  imageUrlThumbnail?: string; // Optional thumbnail URL
}

  export const profile: Profile = {
  "socialUrl": "",
  "artistName": "Aidem",
  "description": "L’image qui vous ressemble.\n\nDe l’image à l’émotion, il n’y a qu’un pas – et je le franchis avec passion.\nAvant de passer derrière l’objectif, j’ai exploré l’univers de l’image comme mannequin, comédien et danseur. Ces expériences m’ont appris à capter l’instant, à ressentir l’intensité d’un regard, d’un mouvement, d’une ambiance.\n\nAujourd’hui, je mets cette sensibilité au service de la photographie et de la vidéo. Inspiré par l’esthétique des films des années 80, les tournages, les shootings et les défilés, j’ai développé un style narratif et cinématographique profondément humain.\n\nMon objectif ? Créer des images qui vous ressemblent, qui racontent votre histoire, et qui marquent les esprits.\n\nÀ bientôt, pour raconter votre histoire en images.",
  "subTitle": "",
  "imageUrl": "/Profil/1736898011993-X.jpeg",
  "imagetype": "profileStorage"
};

