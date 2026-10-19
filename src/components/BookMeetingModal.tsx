import React, { useState } from 'react';
import { useOperations } from '../OperationsContext';
import { meetingRooms } from '../data';

interface BookMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomId?: string;
}

export default function BookMeetingModal({ isOpen, onClose, defaultRoomId }: BookMeetingModalProps) {
  const { bookMeeting } = useOperations();
  const [roomId, setRoomId] = useState(defaultRoomId || 'summit');
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('Mara Vance');
  const [participants, setParticipants] = useState('Mara Vance, Dele Okafor, Tobias Bram');
  const [startTime, setStartTime] = useState('11:30 AM');
  const [endTime, setEndTime] = useState('12:30 PM');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    await bookMeeting({
      roomId,
      title: title.trim(),
      organizer,
      participants,
      startTime,
      endTime,
    });
    setSubmitting(false);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 border-slate-700/60 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg">
              📅
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reserve Meeting Room</h3>
              <p className="text-xs text-slate-400">Schedule cross-pod sync or customer session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Room
            </label>
            <select
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
            >
              {meetingRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.name} (Capacity: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Meeting Topic / Agenda
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q4 Compliance Review & Access Approvals"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Host / Organizer
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Attendees (Comma Separated)
              </label>
              <input
                type="text"
                value={participants}
                onChange={e => setParticipants(e.target.value)}
                placeholder="Mara Vance, Kofi Mensah"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/40 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Booking...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
