import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasMore: false
});

    const fetchItems = useCallback(async (signal, page = 1, limit = 10, q = '') => {
    const queryParams = new URLSearchParams({ page, limit, ...(q && { q }) });
    const res = await fetch(`http://localhost:3001/api/items?${queryParams}`, { signal });
    const data = await res.json();
    setItems(data.items);
    setPagination(data.pagination);
  }, []);

   return (
    <DataContext.Provider value={{ items, pagination, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);