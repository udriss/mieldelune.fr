'use client';

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
} from "@nextui-org/react";
import { Menu } from "lucide-react"; 
import { max } from "lodash";

export function NavbarClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0); // Utiliser useRef au lieu d'un state
  const pathname = usePathname();


  const menuItems = [
    { name: "Réalisations", href: "/" },
    { name: "Photographe", href: "/artiste/" },
    { name: "Réserver", href: "/contact/" },
    //{ name: "Payement", href: "/reserver" },
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 840);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Si on est en haut de la page (moins de 10px), toujours montrer la navbar
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        
        // Si on scroll vers le bas et qu'on a scrollé d'au moins 5px, cacher la navbar
        if (currentScrollY > lastScrollY.current + 5 && currentScrollY > 100) {
          console.log('Hiding navbar - scrolling down:', currentScrollY, 'vs', lastScrollY.current);
          setIsNavbarVisible(false);
        }
        // Si on scroll vers le haut et qu'on a scrollé d'au moins 5px, montrer la navbar
        else if (currentScrollY < lastScrollY.current - 5) {
          console.log('Showing navbar - scrolling up:', currentScrollY, 'vs', lastScrollY.current);
          setIsNavbarVisible(true);
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Retirer lastScrollY des dépendances

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
          className="fixed z-50 rounded-full 
            bg-white/20 backdrop-blur-lg shadow-lg
            hover:bg-white/30 transition-all duration-300
            ring-4 ring-white/10 ring-offset-0"
          style={{
            fontSize: '16px',
            fontFamily: 'Roboto, Arial, sans-serif',
            top: '16px', // Remplace top-4
            right: '16px', // Remplace right-4
            padding: '8px' // Remplace p-2
          }}
        >
          <Menu 
            size={42}
            strokeWidth={1.5}
            className={`transition-transform duration-300 ${
              isSideMenuOpen ? 'rotate-90' : 'rotate-0'
            }`}
          />
        </button>

        {/* Side Menu */}
        <div
          className={`fixed inset-y-0 right-0 
            bg-white/10 backdrop-blur-xl
            border border-white/10
            shadow-[_8px_32px_0_rgba(0,0,0,0.37)]
            transform transition-transform duration-300 ease-in-out z-40
            ${isSideMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{
            fontSize: '16px',
            fontFamily: 'Roboto, Arial, sans-serif',
            width: '256px' // Remplace w-64 (16rem = 256px)
          }}
        >
          <div style={{ 
            marginTop: '80px', // Remplace mt-20 (5rem = 80px)
            padding: '24px', // Remplace p-6 (1.5rem = 24px)
            display: 'flex',
            flexDirection: 'column',
            gap: '16px' // Remplace space-y-4 (1rem = 16px)
          }}>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '16px', // Remplace space-y-4 (1rem = 16px)
              marginTop: '32px' // Remplace mt-8 (2rem = 32px)
            }}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-center rounded-lg transition-colors duration-200 ${
                    item.href === "/contact/"
                      ? pathname === "/contact/"
                        ? 'text-purple-400 font-bold bg-black/90 hover:backdrop-blur-xl'
                        : 'text-purple-600 font-bold hover:bg-purple-500/10 hover:backdrop-blur-xl'
                      : pathname === item.href
                        ? 'text-gray-100 font-bold bg-black/90 hover:backdrop-blur-xl'
                        : 'text-gray-500 font-bold hover:bg-gray-50'
                  }`}
                  style={{
                    fontSize: '20px', // Taille fixe pour le menu mobile
                    fontFamily: 'Roboto, Arial, sans-serif',
                    padding: '8px' // Remplace px-4 py-2 (1rem = 16px, 0.5rem = 8px)
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isSideMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsSideMenuOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <Navbar 
      isBordered 
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className={`bg-background/40 backdrop-blur-md shadow-sm fixed z-50 transition-all duration-300 ease-in-out ${
        isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ 
        backdropFilter: "blur(20px)", 
        WebkitBackdropFilter: "blur(10px)", 
        width: "800px", 
        maxWidth: "800px",
        margin: "0 auto", 
        borderRadius: "0 0 16px 16px", // 1rem = 16px 
        height: "64px", // 4rem = 64px
        padding: "16px 16px 16px 16px", // 1rem = 16px
        top: "0px", // Garder top à 0 et utiliser transform pour l'animation
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row",
        fontSize: "16px", // Taille de police fixe pour la navbar
        fontFamily: "Roboto, Arial, sans-serif" // Police fixe pour la navbar
      }}
    >
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        </NavbarContent>

        <NavbarBrand className="flex items-center" style={{ maxWidth: '200px' }}>
          <Link href="/" color="foreground">
            <p className="font-bold text-inherit" style={{ 
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '18px' // Taille fixe pour le brand
            }}>MIEL DE LUNE</p>
          </Link>
        </NavbarBrand>

        <NavbarContent 
          className="hidden sm:flex absolute left-1/2 transform -translate-x-1/2" 
          justify="center"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            gap: '16px' // Remplace gap-4 (1rem = 16px)
          }}
        >
          {menuItems.map((item) => (
            <NavbarItem 
              key={item.href} 
              isActive={pathname === item.href}
              className="h-full flex items-center"
            >
              <Link 
                href={item.href}
                color={pathname === item.href ? "secondary" : "foreground"}
                className={`rounded-full transition-all duration-300 ease-in-out ${
                  item.href === "/contact/"
                    ? pathname === "/contact/"
                      ? 'text-purple-400 font-bold bg-black hover:bg-gray-800'
                      : 'text-purple-500 font-bold hover:bg-gray-100'
                    : pathname === item.href
                      ? 'text-gray-100 font-bold bg-black hover:bg-gray-800'
                      : 'text-gray-500 font-bold hover:bg-gray-100'
                }`}
                style={{
                  fontFamily: 'Roboto, Arial, sans-serif',
                  fontSize: '18px', // Taille fixe pour les liens de navigation
                  padding: '4px 16px' // Remplace px-4 py-1 (1rem = 16px, 0.25rem = 4px)
                }}
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <Button 
              as={Link} 
              color="secondary" 
              href="/admin" 
              variant="flat"
              className="font-semibold hover:bg-gradient-to-r hover:from-gray-100/80 hover:by-secondary-600/80 hover:to-gray-100/80 hover:shadow-sm"
            >
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </Button>
          </NavbarItem>
        </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            <Link
              href={item.href}
              color={pathname === item.href ? "secondary" : "foreground"}
              className={`w-full ${pathname === item.href ? "font-semibold" : ""}`}
              style={{
                fontSize: '16px',
                fontFamily: 'Roboto, Arial, sans-serif'
              }}
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}