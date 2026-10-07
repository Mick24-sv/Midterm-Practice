import { useState } from 'react'

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
  onDelete?: (record: ViewRecord) => void
  // Ids of records with a delete request in flight, so their row button can
  // show progress and be disabled against double submits.
  deletingIds?: readonly string[]
}

const RECORDS_PER_PAGE = 10

export default function ViewRecordsTable({
  records,
  searchQuery,
  onEdit,
  onDelete,
  deletingIds = [],
}: ViewRecordsTableProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const [pageState, setPageState] = useState({ query: normalizedQuery, index: 0 })
  const filteredRecords = records.filter((record) =>
    [record.id, record.title, record.category, record.updated, record.status]
      .some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
  const pageCount = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE)
  const pageIndex = pageState.query === normalizedQuery ? pageState.index : 0
  const currentPage = Math.min(pageIndex, Math.max(pageCount - 1, 0))
  const firstRecordIndex = currentPage * RECORDS_PER_PAGE
  const visibleRecords = filteredRecords.slice(
    firstRecordIndex,
    firstRecordIndex + RECORDS_PER_PAGE,
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
              {(onEdit !== undefined || onDelete !== undefined) && (
                <th scope="col">Actions</th>
              )}
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
                  {(onEdit !== undefined || onDelete !== undefined) && (
                    <td className="activity-table__actions">
                      {onEdit !== undefined && (
                        <button
                          type="button"
                          className="record-edit-btn"
                          onClick={() => onEdit(record)}
                        >
                          Edit<span className="visually-hidden"> record {record.id}</span>
                        </button>
                      )}
                      {onDelete !== undefined && (
                        <button
                          type="button"
                          className="record-delete-btn"
                          onClick={() => onDelete(record)}
                          disabled={deletingIds.includes(record.id)}
                        >
                          {deletingIds.includes(record.id) ? 'Deleting…' : 'Delete Record'}
                          <span className="visually-hidden"> record {record.id}</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={onEdit === undefined && onDelete === undefined ? 5 : 6}
                  className="view-records-table__empty"
                >
                  {normalizedQuery
                    ? `No records found matching "${searchQuery}".`
                    : 'No records available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <nav className="records-pagination" aria-label="Record pages">
          <span aria-live="polite">
            Showing {firstRecordIndex + 1}–{firstRecordIndex + visibleRecords.length} of{' '}
            {filteredRecords.length}
          </span>
          <div className="records-pagination__controls">
            <button
              type="button"
              onClick={() => setPageState({ query: normalizedQuery, index: currentPage - 1 })}
              disabled={currentPage === 0}
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <span aria-current="page">
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPageState({ query: normalizedQuery, index: currentPage + 1 })}
              disabled={currentPage >= pageCount - 1}
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </section>
  )
}
