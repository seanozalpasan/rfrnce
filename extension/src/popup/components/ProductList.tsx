import React, { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../../shared/api';
import type { Product } from '../../shared/types';

interface ProductListProps {
  activeCartId: number | null;
  onProductsChange?: () => void; // Callback when products are added/removed
}

function ProductList({ activeCartId, onProductsChange }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when active cart changes
  useEffect(() => {
    if (!activeCartId) {
      setProducts([]);
      return;
    }

    fetchProducts();
  }, [activeCartId]);

  const fetchProducts = async () => {
    if (!activeCartId) return;

    setLoading(true);
    setError(null);

    const response = await getProducts(activeCartId);

    if (response.success) {
      setProducts(response.data);
    } else {
      setError(response.error.message);
    }

    setLoading(false);
  };

  const handleDelete = async (productId: number) => {
    if (!activeCartId) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to remove this product?')) {
      return;
    }

    const response = await deleteProduct(activeCartId, productId);

    if (response.success) {
      // Remove from local state
      setProducts(products.filter((p) => p.id !== productId));
      // Notify parent to refresh cart list (product count changed)
      if (onProductsChange) {
        onProductsChange();
      }
    } else {
      alert(response.error.message);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getDisplayName = (product: Product) => {
    // Show product name if available, otherwise show truncated URL
    if (product.name) {
      return truncateText(product.name, 40);
    }
    // Extract domain and path from URL for display
    try {
      const url = new URL(product.url);
      return truncateText(url.hostname + url.pathname, 40);
    } catch {
      return truncateText(product.url, 40);
    }
  };

  // Empty state: no active cart
  if (!activeCartId) {
    return (
      <div className="product-list-empty">
        <p className="text-secondary">Select a cart to view products.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="product-list-loading">
        <p className="text-secondary">Loading products...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="product-list-error">
        <p className="text-error">{error}</p>
        <button className="btn btn-secondary" onClick={fetchProducts}>
          Retry
        </button>
      </div>
    );
  }

  // Empty state: no products in cart
  if (products.length === 0) {
    return (
      <div className="product-list-empty">
        <p className="text-secondary">No products yet. Add products from retail sites.</p>
      </div>
    );
  }

  // Display products
  return (
    <div className="product-list">
      {products.map((product) => (
        <div
          key={product.id}
          className={`product-item ${product.status === 'pending' ? 'pending' : ''}`}
          title={
            product.status === 'pending'
              ? 'Please be patient, gathering product data...'
              : product.status === 'failed'
              ? 'Could not extract product information'
              : ''
          }
        >
          {/* Status Indicator */}
          <div className="product-status">
            {product.status === 'pending' && (
              <span className="status-icon status-pending" title="Please be patient, gathering product data...">
                ⚠️
              </span>
            )}
            {product.status === 'failed' && (
              <span className="status-icon status-failed" title="Could not extract product information">
                ✕
              </span>
            )}
            {product.status === 'complete' && (
              <span className="status-icon status-complete">✓</span>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-name">{getDisplayName(product)}</div>
            <div className="product-price">{product.price || '—'}</div>
          </div>

          {/* Delete Button */}
          <button
            className="product-delete"
            onClick={() => handleDelete(product.id)}
            aria-label="Delete product"
            title="Remove product"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
