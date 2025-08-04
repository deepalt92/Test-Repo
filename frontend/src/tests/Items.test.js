
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from '../state/DataContext';
import Items from '../pages/Items';

// Mock react-window since it doesn't work well with jest-dom
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }) => {
    const items = Array.from({ length: itemCount }).map((_, index) => 
      children({ index, style: {} })
    );
    return <div>{items}</div>;
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <DataProvider>
        {component}
      </DataProvider>
    </BrowserRouter>
  );
};

describe('Items Component', () => {
  it('shows loading skeleton when no items', () => {
    renderWithProviders(<Items />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    renderWithProviders(<Items />);
    const searchInput = screen.getByPlaceholderText('Search items...');
    
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('laptop');
    });
  });

  it('handles pagination', async () => {
    renderWithProviders(<Items />);
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
  });

  it('displays items in virtualized list', async () => {
    renderWithProviders(<Items />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(10); // default page size
  });
});