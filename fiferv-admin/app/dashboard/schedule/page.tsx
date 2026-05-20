'use client';

import { useEffect, useState } from 'react';
import { getScheduleConfig, updateSchedule } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await getScheduleConfig();
      
      // Initialize with all days if empty
      if (data.length === 0) {
        const defaultSchedule = DAYS.map((day, idx) => ({
          id: `default-${idx}`,
          day_of_week: day,
          start_time: '18:00', // 6 PM
          end_time: '08:00', // 8 AM
          enabled: idx < 5, // Mon-Fri enabled by default
        }));
        setSchedule(defaultSchedule);
      } else {
        setSchedule(data);
      }
    } catch (err) {
      setError('Failed to load schedule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async (id: string, field: string, value: any) => {
    setError(null);
    setSuccess(null);

    const updated = schedule.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setSchedule(updated);

    try {
      setSaving(true);
      await updateSchedule(id, { [field]: value });
      setSuccess('Schedule updated');
    } catch (err) {
      setError('Failed to update schedule');
      console.error(err);
      loadSchedule();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">After-Hours Schedule</h2>
        <p className="text-slate-600 mt-1">Configure when the AI answering system is active</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Day</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Enabled</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">After-Hours Start</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">After-Hours End</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schedule.map((day) => (
                <tr key={day.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 w-24">{day.day_of_week}</td>
                  <td className="px-6 py-4 text-sm w-24">
                    <button
                      onClick={() => handleUpdateSchedule(day.id, 'enabled', !day.enabled)}
                      disabled={saving}
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${
                        day.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {day.enabled ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="time"
                      value={day.start_time}
                      onChange={(e) => handleUpdateSchedule(day.id, 'start_time', e.target.value)}
                      disabled={saving || !day.enabled}
                      className="px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => handleUpdateSchedule(day.id, 'end_time', e.target.value)}
                      disabled={saving || !day.enabled}
                      className="px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {day.enabled ? (
                      <span className="text-green-700 font-medium">
                        {day.start_time} - {day.end_time}
                      </span>
                    ) : (
                      <span className="text-slate-500">Disabled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
        <h4 className="font-semibold text-blue-900">ℹ️ How it Works</h4>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>• <strong>Enabled:</strong> Toggle after-hours answering on/off for each day</li>
          <li>• <strong>After-Hours Start:</strong> Time when the AI begins answering (e.g., 6:00 PM)</li>
          <li>• <strong>After-Hours End:</strong> Time when the AI stops answering (e.g., 8:00 AM)</li>
          <li>• <strong>Schedule is 24-hour format:</strong> 18:00 = 6 PM, 08:00 = 8 AM</li>
          <li>• <strong>Example:</strong> If Start = 18:00 and End = 08:00, AI answers 6 PM to 8 AM</li>
        </ul>
      </div>

      {/* Current Schedule Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-4">Current Configuration</h4>
        <div className="space-y-2 text-sm">
          {schedule.map((day) => (
            <div key={day.id} className="flex justify-between">
              <span className="font-medium text-slate-700">{day.day_of_week}</span>
              <span className="text-slate-600">
                {day.enabled ? `${day.start_time} - ${day.end_time}` : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
