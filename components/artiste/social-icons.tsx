"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconType } from '@icons-pack/react-simple-icons';
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp } from '@icons-pack/react-simple-icons';
import { ClipLoader } from 'react-spinners';


interface SocialLink {
  label: string;
  href: string;
  icon: IconType;
  hoverColor: string;
  showed: boolean;
}

export const TikTokColoredIcon = () => (
  <svg
     width="124"
     height="124"
     viewBox="62.37 70.49 442.30795 499.94617"
     version="1.1"
     id="svg9"
     xmlns="http://www.w3.org/2000/svg">
    <g
       fill="#ee1d52"
       id="g1"
       transform="translate(-116.50204)">
      <path
         d="m 196,498.32 1.64,4.63 c -0.21,-0.53 -0.81,-2.15 -1.64,-4.63 z m 64.9,-104.93 c 2.88,-24.88 12.66,-38.81 31.09,-53.09 26.37,-19.34 59.31,-8.4 59.31,-8.4 V 267 a 135.84,135.84 0 0 1 23.94,1.48 V 352 c 0,0 -32.93,-10.94 -59.3,8.41 -18.42,14.27 -28.22,28.21 -31.09,53.09 -0.09,13.51 2.34,31.17 13.53,46.44 q -4.15,-2.22 -8.46,-5.06 C 265.27,437.61 260.78,411.7 260.9,393.39 Z M 511.25,147 c -18.14,-20.74 -25,-41.68 -27.48,-56.39 h 22.82 c 0,0 -4.55,38.57 28.61,76.5 l 0.46,0.51 A 132.76,132.76 0 0 1 511.25,147 Z m 109.93,58.8 v 81.84 c 0,0 -29.12,-1.19 -50.67,-6.91 -30.09,-8 -49.43,-20.27 -49.43,-20.27 0,0 -13.36,-8.75 -14.44,-9.36 v 169 c 0,9.41 -2.47,32.91 -10,52.51 -9.83,25.64 -25,42.47 -27.79,45.91 0,0 -18.45,22.75 -51,38.07 -29.34,13.82 -55.1,13.47 -62.8,13.82 0,0 -44.53,1.84 -84.6,-25.33 a 169.63,169.63 0 0 1 -24.16,-20.26 l 0.2,0.15 c 40.08,27.17 84.6,25.33 84.6,25.33 7.71,-0.35 33.47,0 62.8,-13.82 32.52,-15.32 51,-38.07 51,-38.07 2.76,-3.44 18,-20.27 27.79,-45.92 7.51,-19.59 10,-43.1 10,-52.51 V 231 c 1.08,0.62 14.43,9.37 14.43,9.37 0,0 19.35,12.28 49.44,20.27 21.56,5.72 50.67,6.91 50.67,6.91 v -64.13 c 9.96,2.33 18.45,2.96 23.96,2.38 z"
         id="path1" />
    </g>
    <path
       d="m 480.72796,203.42 v 64.11 c 0,0 -29.11,-1.19 -50.67,-6.91 -30.09,-8 -49.44,-20.27 -49.44,-20.27 0,0 -13.35,-8.75 -14.43,-9.37 V 400 c 0,9.41 -2.47,32.92 -10,52.51 -9.83,25.65 -25,42.48 -27.79,45.92 0,0 -18.46,22.75 -51,38.07 -29.33,13.82 -55.09,13.47 -62.8,13.82 0,0 -44.52,1.84 -84.6,-25.33 l -0.2,-0.15 a 157.5,157.5 0 0 1 -11.93,-13.52 c -12.79,-16.27 -20.629999,-35.51 -22.599999,-41 a 0.24,0.24 0 0 1 0,-0.07 c -3.17,-9.54 -9.83,-32.45 -8.92,-54.64 1.61,-39.15 14.809999,-63.18 18.299999,-69.2 a 162.84,162.84 0 0 1 35.53,-43.41 148.37,148.37 0 0 1 42.22,-25 141.61,141.61 0 0 1 52.4,-11 v 64.9 c 0,0 -32.94,-10.9 -59.3,8.4 -18.43,14.28 -28.21,28.21 -31.09,53.09 -0.12,18.31 4.37,44.22 29,61.5 q 4.31,2.85 8.46,5.06 a 65.85,65.85 0 0 0 15.5,15.05 c 24.06,15.89 44.22,17 70,6.68 17.19,-6.9 30.13,-22.45 36.13,-39.68 3.77,-10.76 3.72,-21.59 3.72,-32.79 V 90.61 h 60 c 2.48,14.71 9.34,35.65 27.48,56.39 a 132.76,132.76 0 0 0 24.41,20.62 c 2.64,2.85 16.14,16.94 33.47,25.59 a 130.62,130.62 0 0 0 28.15,10.21 z"
       id="path2" />
    <path
       d="m 71.387961,450.39 v 0.05 l 1.48,4.21 c -0.17,-0.49 -0.72,-1.98 -1.48,-4.26 z"
       fill="#69c9d0"
       id="path3" />
    <path
       d="m 182.39796,278 a 148.37,148.37 0 0 0 -42.22,25 162.84,162.84 0 0 0 -35.52,43.5 c -3.49,6 -16.689999,30.05 -18.299999,69.2 -0.91,22.19 5.75,45.1 8.92,54.64 a 0.24,0.24 0 0 0 0,0.07 c 2,5.44 9.809999,24.68 22.599999,41 a 157.5,157.5 0 0 0 11.93,13.52 166.64,166.64 0 0 1 -35.879999,-33.64 c -12.68,-16.13 -20.5,-35.17 -22.54,-40.79 a 1,1 0 0 1 0,-0.12 v -0.07 c -3.18,-9.53 -9.86,-32.45 -8.93,-54.67 1.61,-39.15 14.81,-63.18 18.3,-69.2 a 162.68,162.68 0 0 1 35.519999,-43.5 148.13,148.13 0 0 1 42.22,-25 144.63,144.63 0 0 1 29.78,-8.75 148,148 0 0 1 46.57,-0.69 V 267 a 141.61,141.61 0 0 0 -52.45,11 z"
       fill="#69c9d0"
       id="path4" />
    <path
       d="m 367.26796,90.61 h -60 v 318.61 c 0,11.2 0,22 -3.72,32.79 -6.06,17.22 -18.95,32.77 -36.13,39.67 -25.79,10.36 -45.95,9.21 -70,-6.68 a 65.85,65.85 0 0 1 -15.54,-15 c 20.49,10.93 38.83,10.74 61.55,1.62 17.17,-6.9 30.08,-22.45 36.12,-39.68 3.78,-10.76 3.73,-21.59 3.73,-32.78 V 70.49 h 82.85 c 0,0 -0.93,7.92 1.14,20.12 z m 113.46,95.08 v 17.73 a 130.62,130.62 0 0 1 -28.1,-10.21 c -17.33,-8.65 -30.83,-22.74 -33.47,-25.59 a 93.69,93.69 0 0 0 9.52,5.48 c 21.07,10.52 41.82,13.66 52.05,12.59 z"
       fill="#69c9d0"
       id="path5" />
  </svg>
  );
  

export function SocialIcons() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  interface SocialMediaInfo {
    label: string;
    href: string;
    icon: string;
    hoverColor: string;
    showed: boolean;
  }

  useEffect(() => {
    async function fetchSocialLinks() {
      try {
        const response = await fetch('/api/getSocialMediaInfo');
        const data = (await response.json()) as Record<string, SocialMediaInfo>;
        
        // Transform data into component format
        const formattedLinks = Object.entries(data)
          .filter(([_, data]) => data.showed)
          .map(([_, data]) => ({
            label: data.label,
            href: data.href,
            icon: getIconComponent(data.icon),
            hoverColor: data.hoverColor,
            showed: data.showed
          }));
          
        setSocialLinks(formattedLinks);
      } catch (error) {
        console.error('Error fetching social links:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSocialLinks();
  }, []);

  const getIconComponent = (iconName: string): IconType => {
    const icons: Record<string, IconType> = {
      SiFacebook,
      SiInstagram,
      SiTiktok,
      SiWhatsapp
    };
    return icons[iconName];
  };

  if (isLoading) return (
  <div className='flex justify-center '>
    <ClipLoader size={50} color={"#123abc"} loading={true} />
    </div>
  );

  return (
    
      <div className="flex gap-6 items-center justify-center mt-4 mb-16">
        {socialLinks.map((social) => (
          <Link
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative transition-all duration-300 hover:scale-110 flex flex-col items-center"
            aria-label={social.label}
            onMouseEnter={() => setHoveredIcon(social.label)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            {social.label === 'TikTok' ? (
              <>
                <div className={`absolute transition-opacity duration-300 ${
                  hoveredIcon === 'TikTok' ? 'opacity-100' : 'opacity-0'
                }`}>
                  <TikTokColoredIcon />
                </div>
                <div className={`transition-opacity duration-300 ${
                  hoveredIcon === 'TikTok' ? 'opacity-0' : 'opacity-100'
                }`}>
                  <social.icon size={128} className="text-gray-600" />
                </div>
              </>
            ) : (
              <social.icon 
                size={50} 
                className="text-gray-600 transition-colors duration-300"
                style={{ color: hoveredIcon === social.label ? social.hoverColor : undefined }}
              />
            )}
            
            {/* Ajouter le texte "Contact" sous l'icône WhatsApp */}
            {social.label === 'WhatsApp' && (
              <span 
                className="mt-2 text-sm font-medium transition-colors duration-300"
                style={{ 
                  color: hoveredIcon === 'WhatsApp' ? '#374151' : social.hoverColor 
                }}
              >
                Contact
              </span>
            )}
          </Link>
        ))}
      </div>
    
  );
}