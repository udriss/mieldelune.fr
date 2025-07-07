import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {

  const router = useRouter();

  return (
    <header className="text-white bg-gray-800 p-4 flex items-center justify-between rounded-[20px]">
      <Button
        onClick={() => router.push("/")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-base"
      >
        <ArrowLeft className="mr-2 h-4 w-4 text-lg" />
        Retour à l&apos;accueil
      </Button>
      <h1 className="text-3xl font-bold">Panneau admin</h1>
      <Button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Déconnexion
      </Button>
    </header>
  );
}