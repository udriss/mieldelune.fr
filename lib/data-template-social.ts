export interface SocialMediaLink {
  icon: string;
  href: string;
  label: string;
  hoverColor: string;
  hoverIcon?: string;
  showed: boolean;
}

export interface SocialMediaData {
  [key: string]: SocialMediaLink;
}
