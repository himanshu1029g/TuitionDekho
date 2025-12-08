// src/components/TeacherCard.tsx
import React from "react";
import { formatLocation } from '@/lib/utils';

type BackendTeacher = any;

import { useNavigate } from 'react-router-dom';

const TeacherCard: React.FC<{ teacher: BackendTeacher }> = ({ teacher }) => {
  const navigate = useNavigate();
  const name = teacher.userId?.name || teacher.name || 'Unknown';
  const rating = teacher.rating ?? 0;

  return (
    <div className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{name}</h3>

      <p className="text-gray-600"><span className="font-medium">Subject:</span> {teacher.subjects || teacher.subject}</p>
      <p className="text-gray-600"><span className="font-medium">City:</span> {formatLocation(teacher.location) || '-'}</p>
      <p className="text-gray-600"><span className="font-medium">Mode:</span> {teacher.mode}</p>
      <p className="text-gray-600"><span className="font-medium">Experience:</span> {teacher.experience || '-'}</p>
      <p className="text-yellow-500 font-medium">★ {rating.toFixed(1)} / 5</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => navigate(`/teacher/${teacher._id || teacher.id}`)} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">View Profile</button>
        <button onClick={() => navigate(`/teacher/${teacher._id || teacher.id}`)} className="w-full border border-blue-500 text-blue-500 py-2 rounded hover:bg-blue-50">Request</button>
      </div>
    </div>
  );
};

export default TeacherCard;
