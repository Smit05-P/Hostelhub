"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Building2, Bed, DollarSign, LayoutList } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function AddRoomPage() {
  const [formData, setFormData] = useState({
    roomNumber: "",
    capacity: "2",
    price: "",
    floor: "0",
    type: "Standard",
    amenities: ["WiFi", "Water"]
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post("/api/rooms", {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        price: parseFloat(formData.price),
        floor: parseInt(formData.floor, 10),
        status: "Available"
      });
      
      addToast("New room asset registered successfully!", "success");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("Error adding room:", error);
      addToast(error.response?.data?.error || "Failed to register room asset.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen pb-20">
      <div className="mb-10">
        <Link 
          href="/admin/rooms" 
          className="group flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all gap-2"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Return to Inventory
        </Link>
      </div>

      <div className="space-y-2 mb-12">
         <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Facility Provisioning</span>
         </div>
         <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
            Initialize Room Asset
         </h1>
         <p className="text-slate-500 font-medium uppercase text-xs tracking-[0.2em] italic">Define specifications for a new residential unit.</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200/50 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-20" />
         
         <form onSubmit={handleSubmit} className="p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Room Number */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Identifier</label>
                  <div className="relative group">
                     <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-blue-500 transition-colors" />
                     <input
                        type="text"
                        name="roomNumber"
                        required
                        value={formData.roomNumber}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/20 placeholder:text-slate-200 font-bold text-slate-900 transition-all shadow-inner italic uppercase tracking-tighter"
                        placeholder="e.g. A-101"
                     />
                  </div>
               </div>

               {/* Capacity */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maximum Occupancy</label>
                  <div className="relative group">
                     <Bed className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-blue-500 transition-colors" />
                     <input
                        type="number"
                        name="capacity"
                        required
                        min="1"
                        max="10"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/20 placeholder:text-slate-200 font-bold text-slate-900 transition-all shadow-inner italic"
                     />
                  </div>
               </div>

               {/* Price */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Subscription Fee ($)</label>
                  <div className="relative group">
                     <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-blue-500 transition-colors" />
                     <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/20 placeholder:text-slate-200 font-bold text-slate-900 transition-all shadow-inner"
                        placeholder="0.00"
                     />
                  </div>
               </div>

               {/* Floor */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Floor Level</label>
                  <div className="relative group">
                     <LayoutList className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-blue-500 transition-colors" />
                     <input
                        type="number"
                        name="floor"
                        required
                        value={formData.floor}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/20 placeholder:text-slate-200 font-bold text-slate-900 transition-all shadow-inner"
                     />
                  </div>
               </div>
            </div>

            {/* Amenities */}
            <div className="space-y-6">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Included Amenities</label>
               <div className="flex flex-wrap gap-4">
                  {["WiFi", "AC", "Laundry", "Attached Bathroom", "Power Backup"].map(amenity => {
                     const isSelected = formData.amenities.includes(amenity);
                     return (
                        <button
                           key={amenity}
                           type="button"
                           onClick={() => handleAmenityToggle(amenity)}
                           className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              isSelected 
                                 ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' 
                                 : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                           }`}
                        >
                           {amenity}
                        </button>
                     );
                  })}
               </div>
            </div>

            <div className="pt-10 border-t border-slate-50 flex items-center justify-end gap-6">
               <Link 
                  href="/admin/rooms" 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
               >
                  Cancel
               </Link>
               <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-4 rounded-[1.75rem] bg-slate-900 px-12 py-5 text-[11px] font-black text-white uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 italic"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Finalize Provisioning
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
