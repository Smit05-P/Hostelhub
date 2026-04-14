"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { User, Mail, Phone, Hash, ShieldCheck, MapPin, UserSquare2, Loader2, Save, Building2, BedDouble, CheckCircle, AlertCircle, Edit2, X, Camera, Fingerprint, Sparkles, GraduationCap, BookOpen, Calendar, FileText, UploadCloud, Download, Clock } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  emergencyContact: z.string().optional(),
  guardianName: z.string().optional(),
  address: z.string().optional(),
  collegeName: z.string().optional(),
  course: z.string().optional(),
  year: z.string().optional(),
  stayDuration: z.string().optional(),
});

const Skeleton = ({ className }) => (
  <div className={`bg-slate-200 animate-pulse rounded-2xl ${className}`} />
);

export default function StudentProfilePage() {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (userData) {
      setProfile(userData);
      reset({ 
        name: userData.name || "", 
        phone: userData.phone || "", 
        emergencyContact: userData.emergencyContact || "", 
        guardianName: userData.guardianName || "", 
        address: userData.address || "",
        collegeName: userData.collegeName || "",
        course: userData.course || "",
        year: userData.year || "",
        stayDuration: userData.stayDuration || "12"
      });
      if (userData.assignedRoomId) {
        axios.get(`/api/rooms/${userData.assignedRoomId}`).then(res => setRoom(res.data)).catch(err => console.error("Room fetch error:", err));
      }
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [userData, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await axios.put(`/api/students/${user.uid}`, data);
      setProfile({ ...profile, ...data });
      setIsEditing(false);
      addToast("Profile synchronized successfully.", "success");
    } catch (error) {
      addToast("Failed to synchronize profile data.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast("Asset oversized. Limit: 2MB", "error"); return; }
    setUploading(true);
    try {
      const storageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await axios.put(`/api/students/${user.uid}`, { profileImage: url });
      setProfile({ ...profile, profileImage: url });
      addToast("Profile image updated successfully.", "success");
    } catch (error) {
      console.error("Upload error:", error);
      addToast(error.response?.data?.error || "Failed to upload image. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleIdProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast("Document oversized. Limit: 5MB", "error"); return; }
    
    setUploadingId(true);
    try {
      const storageRef = ref(storage, `id_proofs/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await axios.put(`/api/students/${user.uid}`, { idProof: url });
      setProfile({ ...profile, idProof: url });
      addToast("ID Proof transmitted successfully.", "success");
    } catch (error) {
      console.error("ID proof upload error:", error);
      addToast("Encryption layer failure: Could not persist ID proof.", "error");
    } finally {
      setUploadingId(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 pb-20 space-y-8 sm:space-y-10">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-10">
          <div className="w-full lg:w-1/3 space-y-6 sm:space-y-8">
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 p-6 sm:p-10 flex flex-col items-center shadow-sm">
              <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] sm:rounded-[3rem] mb-6 sm:mb-8" />
              <Skeleton className="w-48 h-8 mb-4" />
              <Skeleton className="w-32 h-4 mb-8" />
              <div className="w-full grid grid-cols-2 gap-4">
                <Skeleton className="h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem]" />
                <Skeleton className="h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem]" />
              </div>
            </div>
            <Skeleton className="h-48 sm:h-64 rounded-[2.5rem] sm:rounded-[3rem]" />
          </div>
          <div className="flex-1 bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-slate-200 p-8 sm:p-12 space-y-8 sm:space-y-12 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="w-24 sm:w-32 h-6" />
                  <Skeleton className="w-32 sm:w-48 h-4" />
                </div>
              </div>
              <Skeleton className="w-24 sm:w-32 h-10 sm:h-12 rounded-xl sm:rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="w-20 sm:w-24 h-4 ml-2" />
                  <Skeleton className="h-12 sm:h-14 rounded-2xl sm:rounded-3xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-10">
        
        {/* Left: Profile Card */}
        <div className="w-full lg:w-1/3 space-y-6 sm:space-y-8">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 shadow-sm p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            {/* Header accent */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-indigo-900 overflow-hidden">
            </div>
            <div className="relative mt-8 sm:mt-12 mb-6 sm:mb-8">
               <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] sm:rounded-[3rem] bg-white p-2 shadow-2xl border-4 border-white transform group-hover:rotate-6 transition-transform overflow-visible">
                  {profile.profileImage ? (
                    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
                      <Image 
                        src={profile.profileImage} 
                        alt={profile.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-5xl font-black text-indigo-600 uppercase italic">
                      {profile.name?.charAt(0)}
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center text-indigo-600 hover:scale-110 active:scale-95 transition-all z-20">
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               </div>
               <div className="absolute bottom-4 right-0 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center text-emerald-500 z-10">
                  <CheckCircle size={24} />
               </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 bg-indigo-50 text-[9px] font-black text-indigo-600 uppercase tracking-widest rounded-full border border-indigo-100">Verified Member</span>
              <span className="px-3 py-1 bg-emerald-50 text-[9px] font-black text-emerald-600 uppercase tracking-widest rounded-full border border-emerald-100 italic">Resident</span>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-bold flex items-center gap-2">
              <Mail size={14} className="text-indigo-500" /> {profile.email}
            </p>
            <div className="w-full mt-10 pt-10 border-t border-slate-100 grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-5 rounded-[2rem] text-center shadow-inner hover:bg-white hover:shadow-md transition-all">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Tier</p>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{profile.status || "Active"}</p>
               </div>
               <div className="bg-slate-50 p-5 rounded-[2rem] text-center shadow-inner hover:bg-white hover:shadow-md transition-all">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">
                    {profile.joiningDate ? new Date(profile.joiningDate).getFullYear() : (profile.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear())}
                  </p>
               </div>
            </div>
          </div>

          {/* Room Card */}
          <div className="bg-slate-900 rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-indigo-100/20 border border-slate-800 relative overflow-hidden group">

            <h3 className="text-xs font-black text-white tracking-[0.3em] uppercase italic flex items-center gap-3 relative z-10">
               <Building2 size={16} className="text-indigo-400" /> Facility Allocation
            </h3>
            {room ? (
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Suite Identifier</p>
                       <p className="text-3xl font-black text-white italic tracking-tighter">RM-{room.roomNumber}</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 text-indigo-400 rounded-2xl">
                       <BedDouble size={28} />
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Rate</p>
                       <p className="text-sm font-black text-white italic">₹{room.price}/mo</p>
                    </div>
                    <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Capacity</p>
                       <p className="text-sm font-black text-white italic">{room.capacity} Beds</p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4 opacity-50 relative z-10">
                 <AlertCircle size={40} className="mx-auto text-amber-500" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Room Assignment</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-8 sm:p-12 space-y-12 relative overflow-hidden group/form">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 pb-10">
               <div className="flex items-center gap-6">
                  <div className="p-4 rounded-[1.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-200 transform -rotate-3 group-hover/form:rotate-0 transition-all duration-500">
                    <UserSquare2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none flex items-center gap-3">
                      Settings <Sparkles className="text-amber-400 w-5 h-5 -mt-4 animate-pulse" />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 font-mono">Autonomous Profile Synchronization</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                 <button type="button" onClick={() => { if (isEditing) reset(); setIsEditing(!isEditing); }}
                   className={`flex items-center gap-3 px-8 py-5 rounded-3xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm ${
                     isEditing 
                       ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:shadow-lg hover:shadow-rose-100 border border-rose-100" 
                       : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                   }`}>
                   {isEditing ? <><X size={18} /> Cancel Edit</> : <><Edit2 size={18} /> Edit Profile</>}
                 </button>
                 {isEditing && (
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 disabled:grayscale transition-all">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                      Sync Changes
                    </button>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <User size={12} className={errors.name ? "text-rose-500" : "text-indigo-500"} /> Identity Fullname
                  </label>
                  <input type="text" {...register("name")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"} ${errors.name && "border-rose-500"}`}
                    placeholder="Enter your registered name" />
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-4 italic">{errors.name.message}</p>}
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <Fingerprint size={12} className="text-slate-400" /> Enrollment Reference
                  </label>
                  <div className="relative group/field">
                    <input type="text" value={profile.enrollmentId || "unassigned_ref"} disabled={true}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-400 cursor-not-allowed shadow-inner italic" />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <ShieldCheck size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-4 italic">* Immutable Academic Identifier</p>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                    <Phone size={12} className={errors.phone ? "text-rose-500" : "text-indigo-500"} /> Primary Communication
                  </label>
                  <input type="text" {...register("phone")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"} ${errors.phone && "border-rose-500"}`}
                    placeholder="Registered Mobile Number" />
                  {errors.phone && <p className="text-[10px] font-bold text-rose-500 ml-4 italic">{errors.phone.message}</p>}
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                    <ShieldCheck size={12} className="text-rose-500" /> SOS Protocol Contact
                  </label>
                  <input type="text" {...register("emergencyContact")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="Emergency Contact Number" />
               </div>

               <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                    <UserSquare2 size={12} className="text-indigo-500" /> Registered Legal Guardian
                  </label>
                  <input type="text" {...register("guardianName")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="Guardian Fullname" />
               </div>

               <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                    <MapPin size={12} className="text-indigo-500" /> Verified Residential Address
                  </label>
                  <textarea rows={4} {...register("address")} disabled={!isEditing}
                    className={`w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner resize-none ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="Enter your complete permanent address" />
               </div>

               {/* Academic Background section */}
               <div className="md:col-span-2 pt-8 pb-4 border-t border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><GraduationCap size={20} /></div>
                  <h4 className="text-xl font-bold text-slate-900 italic uppercase">Academic Details</h4>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <Building2 size={12} className="text-indigo-500" /> Institution Name
                  </label>
                  <input type="text" {...register("collegeName")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="E.g. XYZ University" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <BookOpen size={12} className="text-indigo-500" /> Course / Degree
                  </label>
                  <input type="text" {...register("course")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="E.g. B.Tech Computer Science" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <Calendar size={12} className="text-indigo-500" /> Year / Semester
                  </label>
                  <input type="text" {...register("year")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                    placeholder="E.g. 3rd Year / 5th Sem" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <Clock size={12} className="text-indigo-500" /> Preferred Stay Duration
                  </label>
                  <select {...register("stayDuration")} disabled={!isEditing}
                    className={`w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner uppercase tracking-wider ${!isEditing && "opacity-70 cursor-not-allowed"}`}
                  >
                     <option value="6">6 Months</option>
                     <option value="12">1 Year</option>
                     <option value="24">2 Years</option>
                     <option value="36">3 Years</option>
                     <option value="48">4 Years</option>
                  </select>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 italic">
                     <FileText size={12} className="text-indigo-500" /> Government ID Proof
                  </label>
                  <div className="flex items-center gap-4">
                     {profile?.idProof ? (
                        <div className="flex-1 flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-inner">
                           <div className="flex items-center gap-3">
                              <CheckCircle size={20} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Document Verified</span>
                           </div>
                           <a href={profile.idProof} target="_blank" rel="noreferrer" className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors">
                              <Download size={16} />
                           </a>
                        </div>
                     ) : (
                        <div className="flex-1 flex items-center gap-3 p-5 bg-amber-50 border border-amber-100 rounded-3xl shadow-inner">
                           <AlertCircle size={20} className="text-amber-500" />
                           <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-tight">Pending Verification</span>
                        </div>
                     )}
                     <div className="relative">
                        <input type="file" id="idProofUpload" className="hidden" onChange={handleIdProofUpload} accept=".jpg,.jpeg,.png,.pdf" />
                        <label htmlFor="idProofUpload" className="flex items-center justify-center p-5 bg-slate-900 text-white rounded-3xl shadow-xl hover:bg-indigo-600 active:scale-95 transition-all cursor-pointer">
                           <UploadCloud size={20} />
                        </label>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-start gap-4">
               <ShieldCheck className="text-indigo-600 mt-1" size={20} />
               <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Encrypted synchronization</p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 leading-relaxed uppercase">
                    All profile modifications are subject to administrative audit. Core academic identifiers remain locked.
                  </p>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
