"use client"

import React from 'react';
import Image from 'next/image';

interface LeboncoinCardProps {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  link: string;
}

const LeboncoinCard: React.FC<LeboncoinCardProps> = ({ title, description, price, imageUrl, link }) => {
  return (
    <div className="group relative w-full max-w-[700px] max-h-[800px] mx-auto overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
      <div className="relative h-[500px] w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-all duration-300 group-hover:blur-[2px]"
        />
      </div>
      
      <div className="absolute bottom-0 w-full p-6 text-white bg-black/50 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-90 line-clamp-3">{description}</p>
        <p className="text-lg font-bold mt-2">{price} €</p>
        
        {link && (
          <a 
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full 
                     text-sm hover:bg-white/30 transition-colors duration-200"
          >
            Voir l'annonce
          </a>
        )}
      </div>
    </div>
  );
};

export default LeboncoinCard;