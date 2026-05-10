"use client";

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import config from '../../config';

export default function ReportModal({ isOpen, onClose, onSubmit, reportedUser }) {
  const { dashboard } = config;
  const { report } = dashboard.modals;
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
      setReason('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{report.title}: {reportedUser}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="warning-icon">
              <AlertTriangle size={40} color="#e74c3c" />
            </div>
            <p>{report.description}</p>
            
            <div className="form-group">
              <label>{report.label}</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                required
                className="report-select"
              >
                <option value="">{report.placeholder}</option>
                <option value="spam">{report.reasons.spam}</option>
                <option value="harassment">{report.reasons.harassment}</option>
                <option value="hate_speech">{report.reasons.hate_speech}</option>
                <option value="inappropriate">{report.reasons.inappropriate}</option>
                <option value="other">{report.reasons.other}</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">{report.cancel}</button>
            <button type="submit" className="submit-btn">{report.submit}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
