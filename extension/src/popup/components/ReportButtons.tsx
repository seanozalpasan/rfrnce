import React, { useState, useEffect } from 'react';
import { getCarts, getProducts } from '../../shared/api';
import type { Cart, Product } from '../../shared/types';

interface ReportButtonsProps {
  activeCartId: number | null;
}

function ReportButtons({ activeCartId }: ReportButtonsProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart and products when activeCartId changes
  useEffect(() => {
    if (!activeCartId) {
      setCart(null);
      setProducts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch carts to get the active cart with reportCount and isFrozen
        const cartsResponse = await getCarts();
        if (cartsResponse.success) {
          const activeCart = cartsResponse.data.find((c: Cart) => c.id === activeCartId);
          setCart(activeCart || null);
        }

        // Fetch products for the active cart
        const productsResponse = await getProducts(activeCartId);
        if (productsResponse.success) {
          setProducts(productsResponse.data);
        }
      } catch (err) {
        setError('Failed to load cart data');
        console.error('Error fetching cart/products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCartId]);

  // Determine Generate Report button state
  const getGenerateButtonState = (): { disabled: boolean; tooltip: string } => {
    if (!cart) {
      return { disabled: true, tooltip: '' };
    }

    // Check conditions in priority order per spec
    // 1. Frozen cart
    if (cart.isFrozen) {
      return { disabled: true, tooltip: 'Report limit reached' };
    }

    // 2. Empty cart (no products)
    if (products.length === 0) {
      return { disabled: true, tooltip: 'Add products to generate report' };
    }

    // 3. Has pending products (takes priority over failed)
    const hasPendingProducts = products.some((p) => p.status === 'pending');
    if (hasPendingProducts) {
      return { disabled: true, tooltip: 'Please wait for all products to finish loading' };
    }

    // 4. Has failed products
    const hasFailedProducts = products.some((p) => p.status === 'failed');
    if (hasFailedProducts) {
      return { disabled: true, tooltip: 'Remove failed items to generate report' };
    }

    // 5. Otherwise enabled
    return { disabled: false, tooltip: '' };
  };

  // Handle Generate Report button click
  const handleGenerateReport = () => {
    if (!activeCartId) return;

    // Open report page with mode=generate
    chrome.tabs.create({
      url: chrome.runtime.getURL(`report.html?mode=generate&cartId=${activeCartId}`),
    });
  };

  // Handle View Previous Report button click
  const handleViewReport = () => {
    if (!activeCartId) return;

    // Open report page with mode=view
    chrome.tabs.create({
      url: chrome.runtime.getURL(`report.html?mode=view&cartId=${activeCartId}`),
    });
  };

  const generateButtonState = getGenerateButtonState();

  // Show loading state
  if (loading && !cart) {
    return (
      <footer className="footer">
        <div className="loading-text">Loading...</div>
      </footer>
    );
  }

  // Show error state
  if (error) {
    return (
      <footer className="footer">
        <div className="error-text">{error}</div>
      </footer>
    );
  }

  // Don't show buttons if no cart is selected
  if (!activeCartId || !cart) {
    return (
      <footer className="footer">
        <div className="empty-text">Select a cart to generate reports</div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="report-buttons">
        {/* Generate Report Button */}
        <button
          className="btn btn-primary"
          disabled={generateButtonState.disabled}
          onClick={handleGenerateReport}
          title={generateButtonState.tooltip}
        >
          Generate Report
        </button>

        {/* View Previous Report Button - only visible if reportCount > 0 */}
        {cart.reportCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleViewReport}
          >
            View Previous Report
          </button>
        )}
      </div>
    </footer>
  );
}

export default ReportButtons;
