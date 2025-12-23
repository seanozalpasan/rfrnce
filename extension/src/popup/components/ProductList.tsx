import React, { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../../shared/api';
import type { Product } from '../../shared/types';
import Spinner from './Spinner';

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
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const response = await getProducts(activeCartId);

      // Only update state if this fetch hasn't been cancelled (cart still active)
      if (!cancelled) {
        if (response.success) {
          setProducts(response.data);
        } else {
          setError(response.error.message);
        }
        setLoading(false);
      }
    };

    fetchProducts();

    // Cleanup: cancel this fetch if cart changes
    return () => {
      cancelled = true;
    };
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

    // Optimistic delete - remove from UI immediately
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    setProducts(products.filter((p) => p.id !== productId));

    // Notify parent to refresh cart list (product count changed)
    if (onProductsChange) {
      onProductsChange();
    }

    // Delete from backend
    const response = await deleteProduct(activeCartId, productId);

    if (!response.success) {
      // Restore product on error
      setProducts(prevProducts => [...prevProducts, productToDelete].sort((a, b) => a.id - b.id));
      setError(response.error.message);
      // Notify parent to refresh again
      if (onProductsChange) {
        onProductsChange();
      }
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
        <p className="text-secondary">Create a cart to start adding products</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="product-list-loading">
        <Spinner size="small" text="Loading products..." />
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
        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-xs)' }}>
          No products yet
        </p>
        <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
          Visit any product page on 40 supported retailers and click "Add to rfrnce"
        </p>
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
            {product.status === 'complete' ? (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="product-name product-name-link"
              >
                {getDisplayName(product)}
              </a>
            ) : (
              <div className="product-name">{getDisplayName(product)}</div>
            )}
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
