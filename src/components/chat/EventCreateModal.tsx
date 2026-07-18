import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Check, Sparkles } from 'lucide-react';

interface EventCreateModalProps {
  onClose: () => void;
  onSubmit: (eventData: {
    name: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }) => void;
}

export const EventCreateModal = ({ onClose, onSubmit }: EventCreateModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
  });

  const isValid = formData.name && formData.date && formData.time && formData.location;

  return (
    <div className="event-create-modal">
      <div className="event-create-modal__card">
        {/* Header */}
        <header className="event-create-modal__header">
          <div className="event-create-modal__header-left">
            <div className="event-create-modal__header-icon">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="event-create-modal__heading">Create Social Event</h2>
              <p className="event-create-modal__subheading">Host a culinary meetup</p>
            </div>
          </div>
          <button onClick={onClose} className="event-create-modal__close">
            <X size={24} />
          </button>
        </header>

        {/* Form */}
        <div className="event-create-modal__body">
          <div className="event-create-modal__field">
            <label className="event-create-modal__label">Event Name</label>
            <input
              autoFocus
              placeholder="e.g. Pasta Night at Luigi's"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="event-create-modal__input"
            />
          </div>

          <div className="event-create-modal__row">
            <div className="event-create-modal__field">
              <label className="event-create-modal__label">Date</label>
              <div className="event-create-modal__input-icon-wrap">
                <Calendar size={18} className="event-create-modal__input-icon" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="event-create-modal__input--with-icon"
                />
              </div>
            </div>
            <div className="event-create-modal__field">
              <label className="event-create-modal__label">Time</label>
              <div className="event-create-modal__input-icon-wrap">
                <Clock size={18} className="event-create-modal__input-icon" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="event-create-modal__input--with-icon"
                />
              </div>
            </div>
          </div>

          <div className="event-create-modal__field">
            <label className="event-create-modal__label">Location</label>
            <div className="event-create-modal__input-icon-wrap">
              <MapPin size={18} className="event-create-modal__input-icon" />
              <input
                placeholder="Where is it happening?"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="event-create-modal__input--with-icon"
              />
            </div>
          </div>

          <div className="event-create-modal__field">
            <label className="event-create-modal__label">Description (Optional)</label>
            <textarea
              placeholder="Tell them why they should join..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="event-create-modal__textarea"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="event-create-modal__footer">
          <button
            onClick={onClose}
            className="event-create-modal__cancel"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(formData)}
            disabled={!isValid}
            className={`event-create-modal__submit${isValid ? ' is-valid' : ''}`}
          >
            Send Invite <Check size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
};
