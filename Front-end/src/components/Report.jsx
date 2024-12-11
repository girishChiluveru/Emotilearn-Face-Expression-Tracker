
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Report.css";

const ReportsTable = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingSession, setAnalyzingSession] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:3000/reports");
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching reports:", error);
      setModalMessage("Error fetching reports. Please try again later.");
      //setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (childName, sessionId) => {
    setAnalyzingSession(sessionId);
    try {
      const response = await fetch("http://127.0.0.1:3000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, childName }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      setModalMessage(`Analysis for session ${sessionId} completed successfully!`);
      setShowModal(true);
      //fetchReports(); // Refresh reports after analysis
      navigate("/child-report",{
        state:{childName,sessionId}
      })
    } catch (error) {
      console.error("Error processing analysis:", error);
      setModalMessage(`Failed to process analysis for session ${sessionId}.`);
      setShowModal(true);
    } finally {
      setAnalyzingSession(null);
      //setShowModal(true);
    }
  };

  const handleViewReports = (childName, sessionId) => {
    navigate("/child-report", {
      state: { childName, sessionId },
    });
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter((report) =>
        report.childname.toLowerCase().includes(query)
      );
      setFilteredReports(filtered);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="container">
      <h1 className="heading">Reports Table</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by child name..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Child Name</th>
                <th>Session IDs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report, index) =>
                  report.sessions.map((session, sessionIndex) => (
                    <tr key={`${report.childname}-${session.sessionid}`}>
                      {sessionIndex === 0 && (
                        <>
                          <td rowSpan={report.sessions.length}>{index + 1}</td>
                          <td rowSpan={report.sessions.length}>
                            {report.childname}
                          </td>
                        </>
                      )}
                      <td>{session.sessionid}</td>
                      <td>
                        {session.isProcessed ? (
                          <button
                            className="btn success"
                            onClick={() =>
                              handleViewReports(report.childname, session.sessionid)
                            }
                          >
                            View Reports
                          </button>
                        ) : (
                          <button
                            className="btn warning"
                            onClick={() =>
                              handleAnalyze(report.childname, session.sessionid)
                            }
                            disabled={analyzingSession === session.sessionid}
                          >
                            {analyzingSession === session.sessionid ? (
                              <span className="spinner"></span>
                            ) : (
                              "Analyze"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="4">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h5>Message</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{modalMessage}</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTable;
