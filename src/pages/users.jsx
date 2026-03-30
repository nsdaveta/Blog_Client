import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    axios.get('http://localhost:5000/blog/users')
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

  const toggle = id => {
    setSelected(s => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      await axios.delete('http://localhost:5000/blog/delete-users', { data: { ids: Array.from(selected) } });
      setUsers(u => u.filter(x => !selected.has(x._id)));
      setSelected(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <button onClick={deleteSelected} disabled={selected.size === 0}>
        Delete selected
      </button>
      <ul>
        {users.map(u => (
          <li key={u._id}>
            <label>
              <input
                type="checkbox"
                checked={selected.has(u._id)}
                onChange={() => toggle(u._id)}
              />
              {u.name} ({u.email})
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
