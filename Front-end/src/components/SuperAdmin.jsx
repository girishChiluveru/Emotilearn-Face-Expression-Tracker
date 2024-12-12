/* eslint-disable no-unused-vars */
import  { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function SuperAdmin() {
    const [children, setChildren] = useState([]);

    // Fetch all children
    useEffect(() => {
        axios.get("http://localhost:3000/children")
            .then((res) => setChildren(res.data))
            .catch((err) => console.error(err));
    }, []);

    // Delete a child
    const deleteChild = (id) => {
        axios.delete(`http://localhost:3000/children/${id}`)
            .then(() => setChildren(children.filter((child) => child._id !== id)))
            .catch((err) => console.error(err));
    };

    // Toggle isProcessed for a session
    const toggleIsProcessed = (childId, sessionId, isProcessed) => {
        axios.patch(`http://localhost:3000/sessions/${childId}/${sessionId}`, { isProcessed: !isProcessed })
            .then(() => {
                const updatedChildren = children.map((child) => {
                    if (child._id === childId) {
                        child.sessions = child.sessions.map((session) =>
                            session._id === sessionId ? { ...session, isProcessed: !isProcessed } : session
                        );
                    }
                    return child;
                });
                setChildren(updatedChildren);
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className="container mt-5">
            <h1 className="mb-4">Super Admin Dashboard</h1>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Child Name</th>
                        <th>Password</th>
                        <th>Sessions</th>
                        <th>Is Processed</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {children.map((child) => (
                        <tr key={child._id}>
                            <td>{child.childname}</td>
                            <td>{child.password}</td>
                            <td>
                                {child.sessions.map((session) => (
                                    <div key={session._id}>
                                        {session.sessionId}
                                    </div>
                                ))}
                            </td>
                            <td>
                                {child.sessions.map((session) => (
                                    <div key={session._id}>
                                        <Button
                                            variant={session.isProcessed ? "success" : "danger"}
                                            onClick={() => toggleIsProcessed(child._id, session._id, session.isProcessed)}
                                        >
                                            {session.isProcessed ? "True" : "False"}
                                        </Button>
                                    </div>
                                ))}
                            </td>
                            <td>
                                <Button variant="danger" onClick={() => deleteChild(child._id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}

export default SuperAdmin;
