/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, AlertTriangle, X, Loader2, BarChart3 } from 'lucide-react';
import '../styles/Report.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ReportsTable = () => {
  const navigate = useNavigate();
  const [reports, setReports]             = useState([]);
  const [filteredReports, setFiltered]    = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [modalMessage, setModalMessage]   = useState('');
  const [showModal, setShowModal]         = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setReports(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setModalMessage('Error fetching reports. Please try again later.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Sessions now contain emotion_events — therapist can view them directly
  const handleViewSession = (childName, sessionId) => {
    navigate('/child-report', { state: { childName, sessionId } });
  };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    setFiltered(q ? reports.filter((r) => r.childname.toLowerCase().includes(q)) : reports);
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="report-page">
      {/* Page header */}
      <div className="report-page__header">
        <div className="report-page__title-group">
          <div className="report-page__icon">
            <BarChart3 size={22} color="white" />
          </div>
          <div>
            <h1 className="report-page__title">Session Reports</h1>
            <p className="report-page__subtitle">
              {filteredReports.length} child{filteredReports.length !== 1 ? 'ren' : ''} found
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="report-page__search">
          <Search size={16} className="report-page__search-icon" />
          <input
            id="report-search-input"
            type="text"
            placeholder="Search by child name..."
            value={searchQuery}
            onChange={handleSearch}
            className="report-page__search-input"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="report-page__loading">
          <Loader2 size={28} className="animate-spin" style={{ color: '#FF6B35' }} />
          <span>Loading reports…</span>
        </div>
      ) : (
        <div className="report-page__table-wrap">
          <table className="report-table" id="reports-table">
            <thead>
              <tr>
                <th className="report-table__th">#</th>
                <th className="report-table__th">Child Name</th>
                <th className="report-table__th">Session ID</th>
                <th className="report-table__th">Date</th>
                <th className="report-table__th report-table__th--center">Emotion Samples</th>
                <th className="report-table__th report-table__th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.flatMap((report, idx) =>
                  report.sessions.map((session, sIdx) => (
                    <tr key={`${report.childname}-${session.sessionId}`} className="report-table__row">
                      {sIdx === 0 && (
                        <td className="report-table__td report-table__td--num" rowSpan={report.sessions.length}>{idx + 1}</td>
                      )}
                      {sIdx === 0 && (
                        <td className="report-table__td report-table__td--name" rowSpan={report.sessions.length}>
                          <span className="report-table__name-badge">{report.childname}</span>
                        </td>
                      )}
                      <td className="report-table__td report-table__td--mono">
                        {session.sessionId?.slice(0, 8)}…
                      </td>
                      <td className="report-table__td">
                        {session.sessiondate
                          ? new Date(session.sessiondate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="report-table__td report-table__td--center">
                        <span className={`report-table__sample-badge ${session.emotion_events?.length ? 'report-table__sample-badge--has-data' : ''}`}>
                          {session.emotion_events?.length ?? 0}
                        </span>
                      </td>
                      <td className="report-table__td report-table__td--center">
                        <button
                          className={`report-table__action-btn ${session.emotion_events?.length ? 'report-table__action-btn--active' : 'report-table__action-btn--disabled'}`}
                          onClick={() => handleViewSession(report.childname, session.sessionId)}
                          disabled={!session.emotion_events?.length}
                        >
                          {session.emotion_events?.length ? (
                            <><FileText size={14} /> View Report</>
                          ) : 'No Data'}
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="6" className="report-table__empty">
                    <AlertTriangle size={18} style={{ color: '#ccc' }} />
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Error modal */}
      {showModal && (
        <div className="report-page__modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="report-page__modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-page__modal-header">
              <h5>⚠️ Error</h5>
              <button className="report-page__modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="report-page__modal-body">{modalMessage}</div>
            <div className="report-page__modal-footer">
              <button className="report-page__modal-btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTable;
