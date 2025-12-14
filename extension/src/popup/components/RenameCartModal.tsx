import React, { useState } from 'react';
import { updateCart } from '../../shared/api';

interface RenameCartModalProps {
  cartId: number;
  currentName: string;
  onClose: () => void;
  onOptimisticRename: (cartId: number, newName: string) => void;
  onRenameComplete: (cartId: number, success: boolean, oldName: string) => void;
}

function RenameCartModal({ cartId, currentName, onClose, onOptimisticRename, onRenameComplete }: RenameCartModalProps) {
  const [cartName, setCartName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = cartName.trim();

    // Validate name is not empty
    if (!name) {
      setError('Cart name cannot be empty');
      return;
    }

    // Optimistic update - rename in UI immediately
    onOptimisticRename(cartId, name);
    onClose();

    // Update in backend
    try {
      const response = await updateCart(cartId, { name });

      if (response.success) {
        // Success - notify completion
        onRenameComplete(cartId, true, currentName);
      } else {
        // Revert to old name on error
        onRenameComplete(cartId, false, currentName);
        console.error('Failed to rename cart:', response.error.message);
      }
    } catch (err) {
      // Revert to old name on error
      onRenameComplete(cartId, false, currentName);
      console.error('Error renaming cart:', err);
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
