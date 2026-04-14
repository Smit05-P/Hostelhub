"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Search, User, Check, Loader2, X, Fingerprint, Sparkles } from "lucide-react";

// Simplified debounce helper to avoid lodash dependency if not present
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function StudentPicker({ onSelect, selectedStudentId, label = "Identify Resident Profile" }) {
  const [queryText, setQueryText] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial student if selectedStudentId is provided
  useEffect(() => {
    if (selectedStudentId && !selectedStudent) {
      const fetchStudent = async () => {
         try {
            const response = await axios.get(`/api/students/${selectedStudentId}`);
            if (response.data) {
               setSelectedStudent(response.data);
               setQueryText(response.data.name);
            }
         } catch (e) { console.error("Error fetching initial student:", e); }
      };
      fetchStudent();
    }
  }, [selectedStudentId, selectedStudent]);

  const fetchStudents = async (text) => {
    if (text.length < 2) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/students?search=${encodeURIComponent(text)}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Search error:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the debounced fetch function
  const debouncedFetch = useCallback(
    debounce((text) => fetchStudents(text), 300),
    []
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQueryText(text);
    setIsOpen(true);
    
    if (text.length >= 2) {
      setLoading(true);
      debouncedFetch(text);
    } else {
      setStudents([]);
      setLoading(false);
    }
  };

  const handleSelect = (student) => {
    setSelectedStudent(student);
    setQueryText(student.name);
    setIsOpen(false);
    onSelect(student);
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    setQueryText("");
    setStudents([]);
    onSelect(null);
  };

  return (
    <div className="relative group/picker" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block ml-1 italic">{label}</label>
      
      <div className="relative group">
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-500 z-10 ${isOpen ? 'text-indigo-600' : 'text-slate-300'}`}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} strokeWidth={2.5} />}
        </div>
        
        <input
          type="text"
          placeholder="ENTER NAME, IDENTIFIER OR CREDENTIALS..."
          value={queryText}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-14 pr-12 py-5 bg-white border border-slate-100 rounded-2xl text-[12px] font-black text-slate-900 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all placeholder:text-slate-200 uppercase tracking-widest italic shadow-sm group-hover:shadow-md"
        />
        
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
          {selectedStudent && (
            <button 
              type="button"
              onClick={clearSelection}
              className="p-2 hover:bg-rose-50 rounded-xl text-slate-200 hover:text-rose-500 transition-all active:scale-90"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
          <Fingerprint size={16} className={`transition-colors duration-500 ${selectedStudent ? 'text-indigo-600' : 'text-slate-100'}`} />
        </div>
      </div>

      {isOpen && (students.length > 0) && (
        <div className="absolute z-[100] w-full mt-4 bg-white rounded-[2rem] shadow-3xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="max-h-80 overflow-y-auto py-3 no-scrollbar">
              <div className="px-6 py-2 mb-2 border-b border-slate-50">
                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] italic flex items-center gap-2">
                    <Sparkles size={10} /> Syncing Matches...
                 </span>
              </div>
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-all text-left group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-11 h-11 rounded-1.5xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover/item:bg-white group-hover/item:text-indigo-600 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-500 shadow-sm">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors uppercase italic tracking-tight">{student.name}</p>
                      <p className="text-[10px] font-black text-slate-400 group-hover/item:text-slate-500 tracking-widest uppercase italic font-mono">{student.enrollmentId || student.email || 'NO_ID'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    {student.roomNumber && (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[9px] font-black tracking-widest uppercase italic shadow-lg shadow-slate-200">
                        UNIT {student.roomNumber}
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${selectedStudent?.id === student.id ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : 'bg-transparent border-slate-100 text-transparent'}`}>
                       <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
        </div>
      )}
      
      {isOpen && queryText.length >= 2 && !loading && students.length === 0 && (
        <div className="absolute z-[100] w-full mt-4 bg-white rounded-[2rem] shadow-3xl border border-slate-100 p-12 text-center animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500/10" />
          <div className="mb-6 inline-flex p-5 rounded-full bg-slate-50 text-slate-300">
             <Search size={32} opacity={0.2} strokeWidth={3} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 leading-relaxed">No matching resident profile located in current ledger</p>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Ensure correct identifier spelling</p>
        </div>
      )}
    </div>
  );
}
