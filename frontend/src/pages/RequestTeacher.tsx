import React, { useState } from 'react';
import axios from 'axios';

export default function RequestTeacher({ teacherId }) {
  const [when, setWhen] = useState('');
  const [status, setStatus] = useState(null);

  const sendRequest = async () => {
    try {
      const res = await axios.post('/api/requests', { teacherId, scheduledAt: when });
      setStatus('Request sent');
    } catch (e) {
      setStatus('Failed: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div>
      <h3>Request this teacher</h3>
      <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
      <button onClick={sendRequest}>Send Request</button>
      {status && <div>{status}</div>}
    </div>
  );
}
