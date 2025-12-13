import React, { useState, useEffect } from 'react';
import { getCarts, updateCart } from '../../shared/api';
import { getActiveCartId, setActiveCartId as setActiveCartIdStorage } from '../../shared/storage';
import type { Cart } from '../../shared/types';
import AddCartModal from './AddCartModal';
import RenameCartModal from './RenameCartModal';
import DeleteCartModal from './DeleteCartModal';

function CartTabs() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [activeCartId, setActiveCartId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [renameCart, setRenameCart] = useState<Cart | null>(null);
  const [deleteCartData, setDeleteCartData] = useState<Cart | null>(null);

  // Fetch carts and active cart ID on mount
  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch carts from API
      const response = await getCarts();

      if (response.success) {
        setCarts(response.data);

        // Get stored active cart ID
        const storedActiveId = await getActiveCartId();

        // Find if stored cart exists in the list
        const storedCartExists = response.data.find(c => c.id === storedActiveId);

        if (storedCartExists) {
          setActiveCartId(storedActiveId);
        } else if (response.data.length > 0) {
          // If no stored cart or stored cart doesn't exist, activate first cart
          const firstCartId = response.data[0].id;
          await handleSetActive(firstCartId);
        } else {
          // No carts
          setActiveCartId(null);
        }
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError('Failed to load carts');
      console.error('Error loading carts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (cartId: number) => {
    try {
      // Update cart to active in backend
      const response = await updateCart(cartId, { isActive: true });

      if (response.success) {
        // Update local state
        setActiveCartId(cartId);
        setCarts(carts.map(c => ({ ...c, isActive: c.id === cartId })));

        // Store in chrome.storage
        await setActiveCartIdStorage(cartId);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError('Failed to set active cart');
      console.error('Error setting active cart:', err);
    }
  };

  if (loading) {
    return <div className="cart-tabs-container">
      <p className="text-secondary">Loading carts...</p>
    </div>;
  }

  if (error) {
    return <div className="cart-tabs-container">
      <p className="text-secondary" style={{ color: 'var(--color-status-error)' }}>{error}</p>
    </div>;
  }

  if (carts.length === 0) {
    return (
      <div className="cart-tabs-container">
        <div className="cart-tabs">
          <button className="add-cart-btn" onClick={() => setShowAddModal(true)}>
            Add Cart +
          </button>
        </div>

        {/* Add Cart Modal */}
        {showAddModal && (
          <AddCartModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              loadCarts(); // Refresh cart list
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="cart-tabs-container">
      <div className="cart-tabs">
        {carts.map((cart) => (
          <div key={cart.id} className="cart-tab-wrapper">
            <button
              className={`cart-tab ${cart.id === activeCartId ? 'active' : ''} ${cart.isFrozen ? 'frozen' : ''}`}
              onClick={() => handleSetActive(cart.id)}
              disabled={cart.isFrozen}
            >
              {cart.name}
              {cart.isFrozen && ' 🔒'}
            </button>
            <div className="cart-tab-actions">
              <button
                className="cart-tab-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameCart(cart);
                }}
                title="Rename cart"
              >
                ✏️
              </button>
              <button
                className="cart-tab-action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteCartData(cart);
                }}
                title="Delete cart"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* Add Cart Button */}
        <button className="add-cart-btn" onClick={() => setShowAddModal(true)}>
          Add Cart +
        </button>
      </div>

      {/* Add Cart Modal */}
      {showAddModal && (
        <AddCartModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadCarts(); // Refresh cart list
          }}
        />
      )}

      {/* Rename Cart Modal */}
      {renameCart && (
        <RenameCartModal
          cartId={renameCart.id}
          currentName={renameCart.name}
          onClose={() => setRenameCart(null)}
          onSuccess={() => {
            loadCarts(); // Refresh cart list
          }}
        />
      )}

      {/* Delete Cart Modal */}
      {deleteCartData && (
        <DeleteCartModal
          cartId={deleteCartData.id}
          cartName={deleteCartData.name}
          hasReports={deleteCartData.reportCount > 0}
          onClose={() => setDeleteCartData(null)}
          onSuccess={() => {
            loadCarts(); // Refresh cart list
          }}
        />
      )}
    </div>
  );
}

export default CartTabs;
