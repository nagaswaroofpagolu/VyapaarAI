import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function StatusBadge({ status, type }) {
  if (type === 'transaction') {
    if (status === 'ADD') {
      return (
        <span className="badge badge-add">
          <ArrowUpRight size={13} />
          STOCK IN
        </span>
      );
    }
    return (
      <span className="badge badge-remove">
        <ArrowDownLeft size={13} />
        STOCK OUT
      </span>
    );
  }

  // Stock status badge
  const normalized = status ? status.toUpperCase() : 'IN STOCK';

  if (normalized === 'OUT OF STOCK') {
    return (
      <span className="badge badge-out-of-stock">
        <XCircle size={13} />
        OUT OF STOCK
      </span>
    );
  }

  if (normalized === 'LOW STOCK') {
    return (
      <span className="badge badge-low-stock">
        <AlertTriangle size={13} />
        LOW STOCK
      </span>
    );
  }

  return (
    <span className="badge badge-in-stock">
      <CheckCircle2 size={13} />
      IN STOCK
    </span>
  );
}
