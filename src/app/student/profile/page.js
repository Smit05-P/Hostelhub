"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { User as UserIcon, Mail, Phone, Hash, ShieldCheck, MapPin, UserSquare2, Loader2, Save, Building2, BedDouble, CheckCircle, AlertCircle, Edit2, X, Camera, Fingerprint, Sparkles, GraduationCap, BookOpen, Calendar, FileText, UploadCloud, Download, Clock, Database, Zap, ZapOff } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  emergencyContact: z.string().optional(),
  guardianName: z.string().optional(),
  address: z.string().optional(),
  collegeName: z.string().optional(),
  course: z.string().optional(),
  year: z.string().optional(),
  duration: z.string().optional(),
});

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

const ProtocolField = ({ label, value, icon: Icon, editing, register, name, error, placeholder }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{label}</span>
    </div>
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      {editing ? (
        <input
          {...register(name)}
          placeholder={placeholder}
          className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] text-sm font-black text-slate-900 uppercase italic tracking-tighter focus:border-indigo-600 focus:bg-indigo-50/30 transition-all outline-none"
        />
      ) : (
        <div className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-sm font-black text-slate-900 uppercase italic tracking-tighter opacity-80">
          {value || "NOT SPECIFIED"}
        </div>
      )}
      {error && <p className="mt-2 ml-6 text-[9px] font-black text-rose-500 uppercase italic tracking-widest">{error.message}</p>}
    </div>
  </div>
);

import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function StudentProfilePage() {
  const { user, userData, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [room, setRoom] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ 
    resolver: zodResolver(profileSchema) 
  });
  const watchedDuration = watch("duration", "1Y");

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
        duration: userData.duration || "1Y"
      });
      if (userData.roomId) {
        axios.get(`/api/rooms/${userData.roomId}`).then(res => setRoom(res.data)).catch(err => console.error(err));
      }
      if (userData.hostelId) {
        axios.get(`/api/hostels/${userData.hostelId}`).then(res => setHostel(res.data)).catch(err => console.error(err));
      }
      setLoading(false);
    }
  }, [userData, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    const tid = toast.loading("Syncing profile protocol...");
    try {
      const safePayload = { ...data };
      delete safePayload.duration;
      const response = await axios.put(`/api/students/${(user?._id || user?.id || user?.uid)}`, safePayload);
      await refreshUser();
      setIsEditing(false);
      toast.success("Identity profile synchronised.", { id: tid });
    } catch (error) {
      toast.error("Protocol synchronisation failed.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const tid = toast.loading("Uploading visual data...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profile_images");
      const { data } = await axios.post("/api/upload", formData);
      await axios.put(`/api/students/${(user?._id || user?.id || user?.uid)}`, { profileImage: data.url });
      await refreshUser();
      toast.success("Identity visual updated.", { id: tid });
    } catch (error) {
      toast.error("Upload failed.", { id: tid });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto pb-32">
        <SkeletonHero />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-3xl flex flex-col items-center space-y-8">
                 <Shimmer className="w-48 h-48 rounded-[3.5rem]" />
                 <Shimmer className="w-1/2 h-8 rounded-xl" />
                 <Shimmer className="w-1/3 h-6 rounded-lg" />
              </div>
              <div className="bg-slate-900 p-10 rounded-[4rem] h-[300px] flex flex-col gap-6">
                 <Shimmer className="w-1/4 h-8 rounded-lg opacity-20" />
                 <div className="grid grid-cols-2 gap-6">
                    <Shimmer className="w-full h-24 rounded-3xl opacity-20" />
                    <Shimmer className="w-full h-24 rounded-3xl opacity-20" />
                 </div>
              </div>
           </div>
           <div className="lg:col-span-8 bg-white p-16 rounded-[4.5rem] border border-slate-200 shadow-3xl space-y-12">
              <div className="flex justify-between items-center">
                 <Shimmer className="w-1/3 h-10 rounded-full" />
                 <Shimmer className="w-32 h-12 rounded-2xl" />
              </div>
              <div className="grid grid-cols-2 gap-10">
                 {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                       <Shimmer className="w-1/4 h-4 rounded-lg" />
                       <Shimmer className="w-full h-14 rounded-2xl" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 max-w-7xl mx-auto pb-32"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-2xl">
               <Fingerprint size={28} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Security Node</span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 italic tracking-tighter mt-2 uppercase leading-none">IDENTITY <span className="text-indigo-600 not-italic">PROTOCOL</span></h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Institutional identification and biometric synchronisation hub. 
             All changes are logged within the central security ledger.
           </p>
        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner group-hover:rotate-12 transition-transform">
                    <Database size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sync Status</p>
                    <p className="text-sm font-black text-slate-900 uppercase italic">OPERATIONAL</p>
                 </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4 space-y-10">
          <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-3xl relative overflow-hidden group/profile">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
            <div className="relative flex flex-col items-center">
              <div className="relative mb-10">
                <div className="w-48 h-48 rounded-[3.5rem] bg-slate-50 border-[6px] border-white shadow-2xl overflow-hidden group-hover/profile:scale-105 transition-transform duration-700">
                  {profile?.profileImage ? (
                    <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      <UserIcon size={80} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-all hover:rotate-12"
                >
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">{profile?.name}</h2>
              <div className="px-6 py-2 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{profile?.enrollmentId || "UID-UNASSIGNED"}</span>
              </div>
            </div>

            <div className="mt-12 space-y-6">
               <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group/item hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center shadow-sm group-hover/item:text-indigo-600 transition-colors">
                        <Mail size={18} />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Signal Point</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter truncate">{profile?.email}</p>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group/room">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl" />
             <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover/room:rotate-12 transition-transform">
                      <Building2 size={28} className="text-indigo-300" />
                   </div>
                   <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Spatial Sector</span>
                      <p className="text-sm font-black uppercase tracking-tighter italic">ROOM ALLOCATION</p>
                   </div>
                </div>

                {room ? (
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 italic">Node ID</p>
                        <p className="text-4xl font-black italic tracking-tighter">{room.roomNumber}</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 italic">Capacity</p>
                        <p className="text-4xl font-black italic tracking-tighter">{room.capacity}</p>
                     </div>
                  </div>
                ) : (
                  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center space-y-4">
                     <ZapOff size={32} className="mx-auto text-amber-400 opacity-50" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Not Assigned</p>
                  </div>
                )}
             </div>
          </div>
        </motion.div>

        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-10 sm:p-16 rounded-[4.5rem] border border-slate-200 shadow-3xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16 pb-12 border-b-2 border-slate-50">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">Protocol Details</h3>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ready for synchronisation</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                 <button 
                   type="button" 
                   onClick={() => { if (isEditing) reset(); setIsEditing(!isEditing); }}
                   className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                     isEditing ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-white text-slate-900 border-slate-100 hover:border-slate-900"
                   }`}
                 >
                   {isEditing ? "CANCEL" : "MODERATE"}
                 </button>
                 {isEditing && (
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="flex items-center gap-4 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-3xl transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      SYNC CHANGES
                    </button>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
               <ProtocolField label="Full Identity" name="name" value={profile?.name} icon={UserIcon} editing={isEditing} register={register} error={errors.name} />
               <ProtocolField label="Signal Frequency" name="phone" value={profile?.phone} icon={Phone} editing={isEditing} register={register} error={errors.phone} />
               <ProtocolField label="Emergency Uplink" name="emergencyContact" value={profile?.emergencyContact} icon={ShieldCheck} editing={isEditing} register={register} />
               <ProtocolField label="Guardian Node" name="guardianName" value={profile?.guardianName} icon={UserSquare2} editing={isEditing} register={register} />
               
               <div className="md:col-span-2">
                  <ProtocolField label="Geographic Coordinate" name="address" value={profile?.address} icon={MapPin} editing={isEditing} register={register} />
               </div>

               <div className="md:col-span-2 pt-10 mt-6 border-t-2 border-slate-50">
                  <div className="flex items-center gap-4 mb-12">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <GraduationCap size={24} strokeWidth={2.5} />
                     </div>
                     <h4 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Academic Matrix</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                     <ProtocolField label="Base Institution" name="collegeName" value={profile?.collegeName} icon={Building2} editing={isEditing} register={register} />
                     <ProtocolField label="Course Protocol" name="course" value={profile?.course} icon={BookOpen} editing={isEditing} register={register} />
                     <ProtocolField label="Academic Phase" name="year" value={profile?.year} icon={Calendar} editing={isEditing} register={register} />
                     <ProtocolField label="Residency Plan" name="duration" value={watchedDuration === '6M' ? '6 MONTHS' : watchedDuration.replace('Y', ' YEAR(S)')} icon={Clock} editing={false} register={register} />
                  </div>
               </div>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
