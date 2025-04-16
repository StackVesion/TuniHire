import React, { useState, useEffect, useCallback, useRef } from 'react';

const ItemPagination = ({ items, renderItem, itemsPerPage = 1, autoScroll = true, autoScrollInterval = 2000 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const autoScrollTimerRef = useRef(null);
    
    // Clear timer on component unmount
    useEffect(() => {
        return () => {
            if (autoScrollTimerRef.current) {
                clearInterval(autoScrollTimerRef.current);
            }
        };
    }, []);
    
    // Setup auto-scroll
    useEffect(() => {
        if (!autoScroll || isPaused || items.length <= itemsPerPage) return;
        
        if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current);
        }
        
        autoScrollTimerRef.current = setInterval(() => {
            setCurrentPage(prevPage => prevPage < totalPages ? prevPage + 1 : 1);
        }, autoScrollInterval);
        
        return () => clearInterval(autoScrollTimerRef.current);
    }, [autoScroll, isPaused, totalPages, itemsPerPage, items.length, autoScrollInterval]);
    
    const goToPage = useCallback((page) => {
        setCurrentPage(page);
    }, []);
    
    const getCurrentItems = useCallback(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return items.slice(indexOfFirstItem, indexOfLastItem);
    }, [currentPage, items, itemsPerPage]);
    
    const handleMouseEnter = useCallback(() => {
        setIsPaused(true);
    }, []);
    
    const handleMouseLeave = useCallback(() => {
        setIsPaused(false);
    }, []);
    
    if (items.length === 0) {
        return null;
    }
    
    return (
        <div 
            className="item-pagination" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            <div className="pagination-items animate__animated animate__fadeIn">
                {getCurrentItems().map((item, index) => renderItem(item, index))}
            </div>
            
            {totalPages > 1 && (
                <div className="pagination-controls mt-3">
                    <ul className="pagination pagination-sm justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous"
                            >
                                <span aria-hidden="true">&laquo;</span>
                            </button>
                        </li>
                        
                        {[...Array(totalPages)].map((_, index) => (
                            <li 
                                key={index} 
                                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => goToPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                aria-label="Next"
                            >
                                <span aria-hidden="true">&raquo;</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
            
            <style jsx>{`
                .item-pagination {
                    position: relative;
                    margin-bottom: 20px;
                }
                .pagination-items {
                    min-height: 300px;
                }
                .pagination .page-link {
                    border-color: #dee2e6;
                    color: #007bff;
                    cursor: pointer;
                }
                .pagination .page-item.active .page-link {
                    background-color: #007bff;
                    border-color: #007bff;
                    color: white;
                }
                .pagination .page-item.disabled .page-link {
                    color: #6c757d;
                    pointer-events: none;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ItemPagination;
