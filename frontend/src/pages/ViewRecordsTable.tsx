export interface ViewRecord {
  id: string
  title: string
  category: string
  updated: string
  status: 'Completed' | 'Pending'
}

interface ViewRecordsTableProps {
  records: readonly ViewRecord[]
  searchQuery: string
  onEdit?: (record: ViewRecord) => void
}

export default function ViewRecordsTable({
  records,
  searchQuery,
  onEdit,
}: ViewRecordsTableProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleRecords = records.filter((record) =>
    [record.id, record.title, record.category].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  )

  return (
    <section className="activity-card" aria-labelledby="view-records-title">
      <div className="card-header">
        <h2 id="view-records-title" className="card-title">View Records</h2>
        <span aria-live="polite">
          {visibleRecords.length} {visibleRecords.length === 1 ? 'record' : 'records'}
        </span>
      </div>
      <div className="table-wrapper">
        <table className="activity-table">
          <caption className="visually-hidden">
            Records matching the current search
          </caption>
          <thead>
            <tr>
              <th scope="col">Record ID</th>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Last Updated</th>
              <th scope="col">Status</th>
              {onEdit !== undefined && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRecords.length > 0 ? (
              visibleRecords.map((record) => (
                <tr key={record.id}>
                  <td className="activity-table__id"><code>{record.id}</code></td>
                  <td><strong>{record.title}</strong></td>
                  <td>{record.category}</td>
                  <td className="activity-table__date">{record.updated}</td>
                  <td>
                    <span className={`status-badge status-badge--${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  {onEdit !== undefined && (
                    <td className="activity-table__actions">
                      <button
                        type="button"
                        className="record-edit-btn"
                        onClick={() => onEdit(record)}
                      >
                        Edit<span className="visually-hidden"> record {record.id}</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={onEdit === undefined ? 5 : 6} className="view-records-table__empty">
                  {normalizedQuery
                    ? `No records found matching "${searchQuery}".`
                    : 'No records available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
