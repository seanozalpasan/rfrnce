import React, { useState } from 'react';
import CartTabs from './components/CartTabs';
import ProductList from './components/ProductList';
import ReportButtons from './components/ReportButtons';

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
      <ReportButtons activeCartId={activeCartId} refreshKey={refreshKey} />
    </div>
  );
}

export default App;
