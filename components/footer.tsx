import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-white/10 backdrop-blur-xl py-6 px-4 border-t border-white/20 shadow-[0_8px_32px_0_rgba(0,20,0,0.37)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Legal Links */}
        <nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center">
          <Link 
            href="/mentions-legales" 
            className="text-gray-600 hover:text-black hover:font-bold transition-colors text-sm sm:text-base"
          >
            Mentions légales
          </Link>
          <Link 
            href="/cookies" 
            className="text-gray-600 hover:text-black hover:font-bold transition-colors text-sm sm:text-base"
          >
            Cookies
          </Link>
        </nav>

        {/* Copyright */}
        <div className="text-center w-full">
          <p className="text-sm sm:text-base text-gray-400">
            &copy; {new Date().getFullYear()} <span style={{ margin: '0 10px', fontFamily: 'Roboto, Arial, sans-serif',  }}>MIEL DE LUNE</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}