export default function StatusBadge({ status }) {
  const labels = {
    pending: '⏳ Pending',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    under_review: '🔍 Under Review',
  };
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
}
