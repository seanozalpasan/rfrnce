import React, { useState } from 'react';
import { updateCart } from '../../shared/api';

interface RenameCartModalProps {
  cartId: number;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function RenameCartModal({ cartId, currentName, onClose, onSuccess }: RenameCartModalProps) {
  const [cartName, setCartName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const name = cartName.trim();

      // Validate name is not empty
      if (!name) {
        setError('Cart name cannot be empty');
        setLoading(false);
        return;
      }

      const response = await updateCart(cartId, { name });

      if (response.success) {
        // Success - refresh cart list and close modal
        onSuccess();
        onClose();
      } else {
        // Show error
        setError(response.error.message);
      }
    } catch (err) {
      setError('Failed to rename cart');
      console.error('Error renaming cart:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Rename Cart</h2>

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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameCartModal;
