import React, { useState } from 'react';
import { createCart } from '../../shared/api';
import type { Cart } from '../../shared/types';

interface AddCartModalProps {
  onClose: () => void;
  onOptimisticCreate: (tempCart: Cart) => void;
  onCreateComplete: (tempId: number, realCart: Cart | null) => void;
}

function AddCartModal({ onClose, onOptimisticCreate, onCreateComplete }: AddCartModalProps) {
  const [cartName, setCartName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = cartName.trim() || 'Unnamed Cart';

    // Create temporary cart for optimistic update
    const tempId = -Date.now(); // Negative ID to distinguish from real carts
    const tempCart: Cart = {
      id: tempId,
      name,
      isFrozen: false,
      reportCount: 0,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update - add to UI immediately
    onOptimisticCreate(tempCart);
    onClose();

    // Create cart in backend
    try {
      const response = await createCart({ name });

      if (response.success) {
        // Replace temp cart with real cart
        onCreateComplete(tempId, response.data);
      } else {
        // Remove temp cart and show error
        onCreateComplete(tempId, null);
        console.error('Failed to create cart:', response.error.message);
      }
    } catch (err) {
      // Remove temp cart on error
      onCreateComplete(tempId, null);
      console.error('Error creating cart:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create New Cart</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cart-name" className="form-label">
              Cart Name
            </label>
            <input
              type="text"
              id="cart-name"
              className="form-input"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder="Unnamed Cart"
              autoFocus
              disabled={loading}
            />
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Done'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCartModal;
