import React from 'react';
import { Link } from 'react-router-dom';

// Function to render pagination items
export const itemRender = (current: number, type: string, originalElement: React.ReactNode) => {
  if (type === 'prev') {
    return <Link to="#">Précédent</Link>;
  }
  if (type === 'next') {
    return <Link to="#">Suivant</Link>;
  }
  return originalElement;
};

// Function to handle page size change
export const onShowSizeChange = (current: number, pageSize: number) => {
  console.log(current, pageSize);
};
