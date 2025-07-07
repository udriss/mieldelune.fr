import React from 'react';

interface SuccessMessageProps {
  message: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message }) => {
  return <p className="text-sm text-green-500 font-bold">{message}</p>;
};

const ErrorMessage: React.FC<SuccessMessageProps> = ({ message }) => {
    return <p className="text-sm text-red-500 font-bold">{message}</p>;
  };
  
const WarningMessage: React.FC<SuccessMessageProps> = ({ message }) => {
    return <p className="text-sm text-orange-500 font-bold">{message}</p>;
  };

export {
    SuccessMessage,
    ErrorMessage,
    WarningMessage
};