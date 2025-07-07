"use client"

import React, { useEffect } from 'react';

interface PaymentCardProps {
  amount: string;
  currency: string;
  description: string;
  clientId: string;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ amount, currency, description, clientId }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: amount,
                },
                description: description,
              },
            ],
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            const payerName = details.payer.name.given_name || 'Customer';
            alert(`Transaction completed by ${payerName}`);
          });
        },
      }).render('#paypal-button-container');
    };
    document.body.appendChild(script);
  }, [clientId, currency, amount, description]);

  return (
    <div className="group relative w-full max-w-[700px] max-h-[800px] mx-auto overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
      <div className="relative h-[500px] w-full bg-gray-200 flex items-center justify-center">
        <div id="paypal-button-container" className="w-full"></div>
      </div>
      
      <div className="absolute bottom-0 w-full p-6 text-white bg-black/50 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-2">Paiement</h2>
        <p className="text-sm opacity-90 line-clamp-3">{description}</p>
      </div>
    </div>
  );
};

export default PaymentCard;