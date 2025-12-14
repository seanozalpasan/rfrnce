import React, { useState } from 'react';
import { deleteCart } from '../../shared/api';

interface DeleteCartModalProps {
  cartId: number;
  cartName: string;
  hasReports: boolean; // true if reportCount > 0
  onClose: () => void;
  onOptimisticDelete: (cartId: number) => void; // Called immediately for instant UI update
}

function DeleteCartModal({ cartId, cartName, hasReports, onClose, onOptimisticDelete }: DeleteCartModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    // Optimistic update - remove from UI immediately
    onOptimisticDelete(cartId);
    onClose();

    // Delete from backend in background
    try {
      const response = await deleteCart(cartId);

      if (!response.success) {
        // Show error but don't rollback (cart already removed from UI)
        console.error('Failed to delete cart from backend:', response.error.message);
      }
    } catch (err) {
      console.error('Error deleting cart:', err);
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
