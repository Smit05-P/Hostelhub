"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Settings, Key, RotateCw } from "lucide-react";

export default function HostelSettingsPanel({ hostelId, hostelName: initialName }) {
  const [settings, setSettings] = useState({
    hostelName: "",
    autoApprove: false,
    joinCode: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hostelId) {
      fetchSettings();
    }
  }, [hostelId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/hostels/${hostelId}/settings`);
      setSettings({
        hostelName: response.data.hostel?.hostelName || "",
        autoApprove: response.data.hostel?.autoApprove || false,
        joinCode: response.data.hostel?.joinCode || "",
      });
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/hostels/${hostelId}/settings`, {
        autoApprove: settings.autoApprove,
      });
      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm("Are you sure? Students using the old code won't be able to join.")) {
      return;
    }

    try {
      const response = await axios.post(`/api/hostels/${hostelId}/regenerate-code`);
      setSettings((prev) => ({
        ...prev,
        joinCode: response.data.joinCode,
      }));
      toast.success("Join code regenerated!");
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate code");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <Settings className="inline mr-2" size={24} />
          Hostel Settings
        </h2>
        <p className="text-gray-600 text-sm">
          Configure how students join your hostel
        </p>
      </div>

      {/* Join Code Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key size={18} />
              Student Join Code
            </h3>
            <p className="text-sm text-gray-600">
              Share this code with students to let them join directly
            </p>
          </div>
          <button
            onClick={handleRegenerateCode}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Regenerate Code"
          >
            <RotateCw size={18} />
          </button>
        </div>
        <div className="bg-white p-4 rounded border border-gray-200">
          <input
            type="text"
            value={settings.joinCode}
            readOnly
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded font-mono text-center text-lg tracking-widest"
          />
          <p className="text-xs text-gray-500 mt-2">
            Click regenerate icon to create a new code
          </p>
        </div>
      </div>

      {/* Auto-Approve Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Auto-Approve Members
            </h3>
            <p className="text-sm text-gray-600">
              {settings.autoApprove
                ? "✓ Enabled: Students joining with code are approved immediately"
                : "✗ Disabled: You must manually approve each join request"}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoApprove}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                autoApprove: e.target.checked,
              }))
            }
            className="w-6 h-6 rounded border-gray-300 cursor-pointer"
          />
        </div>

        {!settings.autoApprove && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 Tip: When auto-approve is off, you can:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1 ml-4">
              <li>• Review student profiles before accepting</li>
              <li>• Control hostel capacity</li>
              <li>• Reject invalid requests</li>
            </ul>
          </div>
        )}

        {settings.autoApprove && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700">
              ⚠️ Note: Students will be immediately added to your hostel
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <button
          onClick={fetchSettings}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
