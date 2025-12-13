import React, { useState } from 'react';
import { deleteCart } from '../../shared/api';

interface DeleteCartModalProps {
  cartId: number;
  cartName: string;
  hasReports: boolean; // true if reportCount > 0
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteCartModal({ cartId, cartName, hasReports, onClose, onSuccess }: DeleteCartModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await deleteCart(cartId);

      if (response.success) {
        // Success - refresh cart list and close modal
        onSuccess();
        onClose();
      } else {
        // Show error
        setError(response.error.message);
      }
    } catch (err) {
      setError('Failed to delete cart');
      console.error('Error deleting cart:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Delete Cart</h2>

        <div className="modal-body">
          {hasReports ? (
            <p className="text-secondary">
              Deleting this cart will also delete all generated reports.
              <br /><br />
              Are you sure?
            </p>
          ) : (
            <p className="text-secondary">
              Are you sure you want to delete "{cartName}"?
            </p>
          )}

          {error && <p className="error-message mt-sm">{error}</p>}
        </div>

        <div className="modal-buttons mt-md">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteCartModal;
