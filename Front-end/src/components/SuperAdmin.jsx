import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form } from "react-bootstrap";
import { toast } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

function SuperAdmin() {
    const [view, setView] = useState("child"); // Toggle between "child" and "admin" views
    const [children, setChildren] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ name: "", password: "" });

    // Fetch all children and admins
    useEffect(() => {
        axios
            .get("/children")
            .then((res) => setChildren(res.data))
            .catch((err) => console.error(err));

        axios
            .get("/admins")
            .then((res) => setAdmins(res.data))
            .catch((err) => console.error(err));
    }, []);

    // Delete a child
    const deleteChild = (id) => {
        axios
            .delete(`/children/${id}`)
            .then(() => {
                setChildren(children.filter((child) => child._id !== id));
                toast.success("Child deleted successfully!");
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to delete child.");
            });
    };

    // Delete an admin
    const deleteAdmin = (id) => {
        axios
            .delete(`/admins/${id}`)
            .then(() => {
                setAdmins(admins.filter((admin) => admin._id !== id));
                toast.success("Admin deleted successfully!");
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to delete admin.");
            });
    };

    // Toggle isProcessed for a session
    const toggleIsProcessed = (childId, sessionId, isProcessed) => {
        axios
            .patch(`/sessions/${childId}/${sessionId}`, {
                isProcessed: !isProcessed,
            })
            .then(() => {
                const updatedChildren = children.map((child) => {
                    if (child._id === childId) {
                        child.sessions = child.sessions.map((session) =>
                            session.sessionId === sessionId
                                ? { ...session, isProcessed: !isProcessed }
                                : session
                        );
                    }
                    return child;
                });
                setChildren(updatedChildren);
                toast.success("Session status updated!");
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to update session status.");
            });
    };

    // Add a new admin
    const addAdmin = () => {
        axios
            .post("/admins", newAdmin)
            .then((res) => {
                setAdmins([...admins, res.data]);
                setNewAdmin({ name: "", password: "" }); // Reset the form
                toast.success("Admin added successfully!");
            })
            .catch((err) => {
                console.error(err);
                const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.message || err.response?.data?.error || 'Failed to add admin.';
                toast.error(msg);
            });
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "1200px" }}>
            <h1 className="mb-4 text-center text-primary">Super Admin Dashboard</h1>

            <div
                className="btn-group mb-4 d-flex justify-content-center"
                role="group"
                aria-label="View Toggle"
            >
                <Button
                    variant={view === "admin" ? "primary" : "outline-primary"}
                    onClick={() => setView("admin")}
                >
                    Admin
                </Button>
                <Button
                    variant={view === "child" ? "warning" : "outline-warning"}
                    onClick={() => setView("child")}
                >
                    Child
                </Button>
            </div>

            {view === "child" && (
                <Table striped bordered hover className="shadow-sm">
                    <thead className="bg-success text-white">
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
                                        <div key={session.sessionId}>{session.sessionId}</div>
                                    ))}
                                </td>
                                <td>
                                    {child.sessions.map((session) => (
                                        <div key={session.sessionId}>
                                            <Button
                                                variant={
                                                    session.isProcessed
                                                        ? "success"
                                                        : "danger"
                                                }
                                                className="mb-2"
                                                onClick={() =>
                                                    toggleIsProcessed(
                                                        child._id,
                                                        session.sessionId,
                                                        session.isProcessed
                                                    )
                                                }
                                            >
                                                {session.isProcessed
                                                    ? "True"
                                                    : "False"}
                                            </Button>
                                        </div>
                                    ))}
                                </td>
                                <td>
                                    <Button
                                        variant="danger"
                                        onClick={() => deleteChild(child._id)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {view === "admin" && (
                <>
                    <Table striped bordered hover className="shadow-sm">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>S.No</th>
                                <th>Admin Name</th>
                                <th>Password</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin, index) => (
                                <tr key={admin._id}>
                                    <td>{index + 1}</td>
                                    <td>{admin.name}</td>
                                    <td>{admin.password}</td>
                                    <td>
                                        <Button
                                            variant="danger"
                                            onClick={() => deleteAdmin(admin._id)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="mt-4">
                        <h4 className="text-center text-secondary">Add New Admin</h4>
                        <Form className="p-4 border rounded shadow-sm bg-light">
                            <Form.Group>
                                <Form.Label>Admin Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newAdmin.name}
                                    onChange={(e) =>
                                        setNewAdmin({ ...newAdmin, name: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mt-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) =>
                                        setNewAdmin({ ...newAdmin, password: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Button
                                className="mt-3 w-100"
                                variant="success"
                                onClick={addAdmin}
                            >
                                Add Admin
                            </Button>
                        </Form>
                    </div>
                </>
            )}
        </div>
    );
}

export default SuperAdmin;
