import React, { useEffect, useState } from 'react';
import api from '../api';
import './home.css';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch users');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete('/delete-users', { data: { ids: [userId] } });
            setUsers(users.filter(user => user._id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (isLoading) return <div style={{ color: "white", padding: "2rem" }}>Loading users...</div>;
    if (error) return <div style={{ color: "red", padding: "2rem" }}>{error}</div>;

    return (
        <div style={{ color: "var(--text-primary)", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h2>Users Directory</h2>
            <br />
            {users.length === 0 ? (
                <p>No users found in database.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {users.map((user) => (
                        <div key={user._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                            <div>
                                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--accent)" }}>{user.name}</h3>
                                <p style={{ margin: "0", color: "var(--text-muted)" }}>{user.email}</p>
                                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: user.isVerified ? "var(--success, #4ade80)" : "var(--error, #ef4444)" }}>
                                    {user.isVerified ? '✅ Verified User' : '⏳ Unverified (Pending OTP)'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(user._id)}
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersPage;
