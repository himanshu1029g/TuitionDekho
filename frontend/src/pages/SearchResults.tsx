// src/pages/SearchResults.tsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTeacherSearch } from "../hooks/useTeacherSearch";
import TeacherCard from "../components/TeacherCard";

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();

  // ✅ Single state definition (removed duplicates)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || ""
  );
  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject") || ""
  );
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || ""
  );
  const [selectedMode, setSelectedMode] = useState(
    searchParams.get("mode") || ""
  );
  const [sortBy, setSortBy] = useState("rating");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // ✅ Fetch teachers from backend using hook
  const { data: teachers, total, loading, error } = useTeacherSearch({
    subject: selectedSubject || undefined,
    class: selectedClass || undefined,
    location: selectedLocation || undefined,
    mode: selectedMode || undefined,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Search Results</h2>

      {/* Filters Section */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
      >
        {isFiltersOpen ? "Hide Filters" : "Show Filters"}
      </button>

      {isFiltersOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="City"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
          </select>
        </div>
      )}

      {/* Results Section */}
      {loading && <p>Loading teachers...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && teachers && teachers.length === 0 && (
        <p>No teachers found matching your criteria.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teachers &&
          teachers.map((teacher) => (
            <TeacherCard key={teacher._id} teacher={teacher} />
          ))}
      </div>
    </div>
  );
};

export default SearchResults;
