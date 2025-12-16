import React, { useState } from 'react';
import CartTabs from './components/CartTabs';
import ProductList from './components/ProductList';

function App() {
  const [activeCartId, setActiveCartId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback to refresh cart list when products change (to update product counts)
  const handleProductsChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Rfrnce</h1>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Cart tabs */}
        <CartTabs
          activeCartId={activeCartId}
          onActiveCartChange={setActiveCartId}
          refreshKey={refreshKey}
        />

        {/* Product list */}
        <ProductList activeCartId={activeCartId} onProductsChange={handleProductsChange} />
      </main>

      {/* Footer - Report Buttons */}
      <footer className="footer">
        <button className="btn btn-primary" disabled>
          Generate Report
        </button>
        {/* "View Previous Report" button will appear here when a report exists */}
      </footer>
    </div>
  );
}

export default App;
