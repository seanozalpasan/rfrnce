import React, { useState } from 'react';
import { deleteCart } from '../shared/api';

interface FrozenCartDialogProps {
  cartId: number;
  onKeep: () => void;
  onDeleted: () => void;
}

function FrozenCartDialog({ cartId, onKeep, onDeleted }: FrozenCartDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await deleteCart(cartId);

      if (response.success) {
        onDeleted();
      } else {
        alert(`Failed to delete cart: ${response.error.message}`);
        setDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting cart:', err);
      alert('Failed to delete cart. Please try again.');
      setDeleting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2 className="modal-title">Delete Cart</h2>
          <div className="modal-body">
            <p>Deleting this cart will also delete all generated reports.</p>
            <p>Are you sure?</p>
          </div>
          <div className="modal-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Cart Limit Reached</h2>
        <div className="modal-body">
          <p>This cart has reached its report limit (3 reports).</p>
          <p>You can:</p>
          <ul>
            <li>Keep this cart (view only)</li>
            <li>Delete this cart</li>
          </ul>
        </div>
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={onKeep}>
            Keep
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowConfirmation(true)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default FrozenCartDialog;
