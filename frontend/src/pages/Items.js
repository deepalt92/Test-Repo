import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { Skeleton } from '../components/Skeleton';
import './Items.css';

function Items() {
  const { items, pagination, fetchItems } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        await fetchItems(abortController.signal, currentPage, pagination.limit, searchQuery);
      } catch (error) {
        if (!error.name === 'AbortError') {
          console.error(error);
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [fetchItems, currentPage, pagination.limit, searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style} className="item-row">
        <Link to={'/items/' + item.id}>{item.name}</Link>
        <span className="item-price">${item.price}</span>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="items-container" data-testid="loading-skeleton">
      <div className="search-skeleton">
        <Skeleton height={40} width="100%" />
      </div>
      
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="item-skeleton">
          <Skeleton height={50} width="100%" />
        </div>
      ))}
    </div>
  );

  if (!items.length && !searchQuery) return // filepath: c:\Users\deepa\Downloads\test5\frontend\src\pages\Items.js
  <LoadingSkeleton/>;
  return (
    <div className="items-container">
      <input
        type="search"
        placeholder="Search items..."
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />

      <List
        height={400}
        itemCount={items.length}
        itemSize={50}
        width="100%"
        className="items-list"
      >
        {Row}
      </List>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Items;