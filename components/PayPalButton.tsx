"use client"

import React, { useEffect } from 'react';
declare global {
  interface Window {
    paypal: any;
  }
}

const PAYPAL_CLIENT_ID = ""

const PayPalButton = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.async = true;
    script.onload = () => {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: 'EUR',
                  value: '100.00', // Replace with the amount you want to charge
                },
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
  }, []);

  return <div id="paypal-button-container"></div>;
};

export default PayPalButton;