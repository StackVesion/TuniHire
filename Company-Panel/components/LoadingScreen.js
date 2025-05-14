import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h6 className="mt-3">Loading...</h6>
      </div>
    </div>
  );
};

export default LoadingScreen;
