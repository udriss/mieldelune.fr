import PaymentCard from '@/components/PaymentCard';
import LeboncoinCard from '@/components/LeboncoinCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réserver - Paiement | MielDeLune',
  description: 'Réservez votre séance photo de mariage via PayPal ou Leboncoin. Paiement sécurisé et accompte.',
};

const ReserverPage = () => {
  return (
<div className="min-h-screen flex flex-col md:flex-row items-center justify-center mt-32 min-w-[450px] p-8 m-auto">
  <div className="bg-white p-8 rounded-lg shadow-lg max-w-md min-w-[400px] max-w-[500px] w-full mt-8 mr-2">
        <h1 className="text-2xl font-bold mb-4">Réserver via Paypal</h1>
        <p className="mb-4">Procéder au paiement pour réserver votre place.</p>
        <PaymentCard 
          amount="100.00" 
          currency="EUR" 
          description="Accompte pour votre réservation" 
          clientId="YOUR_PAYPAL_CLIENT_ID"
        />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg min-w-[450px] max-w-[500px] w-full mt-8 ml-2">
        <h1 className="text-2xl font-bold mb-4">Réserver via Leboncoin</h1>
        <p className="mb-4">Procéder au paiement pour réserver votre place.</p>
        <LeboncoinCard
          title="Annonce Leboncoin"
          description="Photographe pro (+5 ans), urgences OK, captures authentiques et livraisons rapides (<1 semaine). Basé à Paris, déplacements partout en France. Contactez-moi !"
          price="100.00"
          imageUrl="https://img.leboncoin.fr/api/v1/lbcpb1/images/bb/a8/dd/bba8dd374b4618261dd4a8c71aa549d642fee4e1.jpg?rule=classified-1200x800-webp" // Remplacez par l'URL de l'image de l'annonce
          link="https://www.leboncoin.fr/ad/services_evenementiels/2910627071" // Remplacez par l'URL de l'annonce Leboncoin
        />
      </div>
    </div>
  );
};

export default ReserverPage;