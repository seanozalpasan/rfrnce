import React, { useState } from 'react';
import { createCart } from '../../shared/api';

interface AddCartModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddCartModal({ onClose, onSuccess }: AddCartModalProps) {
  const [cartName, setCartName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const name = cartName.trim() || 'Unnamed Cart';
      const response = await createCart({ name });

      if (response.success) {
        // Success - refresh cart list and close modal
        onSuccess();
        onClose();
      } else {
        // Show error
        setError(response.error.message);
      }
    } catch (err) {
      setError('Failed to create cart');
      console.error('Error creating cart:', err);
    } finally {
      setLoading(false);
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
