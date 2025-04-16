import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewer = ({ pdfUrl, fileName }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages));
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function toggleFullScreen() {
    setIsFullScreen(!isFullScreen);
  }

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const growIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-viewer-header d-flex justify-content-between align-items-center mb-3">
        <div className="pdf-info d-flex align-items-center">
          <i className="far fa-file-pdf text-danger me-2" style={{ fontSize: '1.5rem' }}></i>
          <span className="file-name">{fileName || 'Resume.pdf'}</span>
        </div>
        <div className="pdf-controls">
          <button 
            className="btn btn-outline-primary btn-sm me-2"
            onClick={toggleFullScreen}
          >
            <i className={`fas fa-${isFullScreen ? 'compress' : 'expand'} me-1`}></i>
            {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noreferrer" 
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="fas fa-external-link-alt me-1"></i>
            Open in New Tab
          </a>
        </div>
      </div>

      <div 
        className={`pdf-viewer-content position-relative ${loading ? 'loading' : ''}`}
        style={{ 
          height: isFullScreen ? 'calc(100vh - 200px)' : '400px', 
          overflow: 'hidden',
          transition: 'height 0.3s ease' 
        }}
      >
        {loading && (
          <div className="pdf-loading position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading PDF...</p>
          </div>
        )}

        <div className="pdf-document-container d-flex justify-content-center" style={{ minHeight: '100%' }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('Error loading PDF:', error);
              setLoading(false);
            }}
            loading={null}
            className="pdf-document"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={1} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              className="pdf-page"
            />
          </Document>
        </div>
      </div>

      {numPages > 1 && (
        <div className="pdf-navigation d-flex justify-content-center align-items-center mt-3">
          <button 
            className="btn btn-outline-primary btn-sm me-3" 
            disabled={pageNumber <= 1}
            onClick={previousPage}
          >
            <i className="fas fa-chevron-left me-1"></i>
            Previous
          </button>
          <span className="current-page">
            Page {pageNumber} of {numPages}
          </span>
          <button 
            className="btn btn-outline-primary btn-sm ms-3" 
            disabled={pageNumber >= numPages}
            onClick={nextPage}
          >
            Next
            <i className="fas fa-chevron-right ms-1"></i>
          </button>
        </div>
      )}

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            className="fullscreen-overlay"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}
          >
            <motion.div 
              className="fullscreen-content"
              variants={growIn}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                background: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                padding: '20px',
                overflow: 'auto'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="far fa-file-pdf text-danger me-2"></i>
                  {fileName || 'Resume.pdf'}
                </h5>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={toggleFullScreen}
                >
                  <i className="fas fa-times me-1"></i>
                  Close
                </button>
              </div>
              
              <div className="fullscreen-pdf-container d-flex justify-content-center">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="pdf-document"
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={1.2} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pdf-page"
                  />
                </Document>
              </div>
              
              {numPages > 1 && (
                <div className="pdf-navigation d-flex justify-content-center align-items-center mt-4">
                  <button 
                    className="btn btn-outline-primary me-3" 
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                  >
                    <i className="fas fa-chevron-left me-1"></i>
                    Previous
                  </button>
                  <span className="current-page">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button 
                    className="btn btn-outline-primary ms-3" 
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                  >
                    Next
                    <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PdfViewer;
