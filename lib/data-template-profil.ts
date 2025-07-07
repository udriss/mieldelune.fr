export const dataTemplateProfile = `
// ICI

export interface Profile {
  socialUrl: string;
  artistName: string;
  subTitle: string;
  imageUrl: string;
  imagetype: 'profileLink' | 'profileStorage';
  description: string;
}

  export const profile: Profile = __PROFILE__;

`;