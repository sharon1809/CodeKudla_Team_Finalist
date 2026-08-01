"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Trash2, UserPlus, Search, RefreshCcw } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ManagePatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [contactNumber, setContactNumber] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) {
      toast.error('Please provide name and age');
      return;
    }

    setCreating(true);
    try {
      await api.post('/patients', {
        name,
        age: Number(age),
        weight: weight ? Number(weight) : undefined,
        gender,
        contactNumber,
        medicalHistory: medicalHistory ? medicalHistory.split(',').map(h => h.trim()) : [],
        allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
      });
      toast.success('Patient created successfully');
      setName('');
      setAge('');
      setWeight('');
      setContactNumber('');
      setMedicalHistory('');
      setAllergies('');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
          <p className="text-gray-500">View and register new patients</p>
        </div>
        <button onClick={fetchPatients} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
          <RefreshCcw className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Patient Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center"><UserPlus className="h-5 w-5 mr-2 text-blue-500"/> New Patient</h2>
          
          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="35"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input 
                type="tel" 
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="+91 9876543210"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (comma separated)</label>
              <textarea 
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                placeholder="Type 2 Diabetes, Hypertension..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma separated)</label>
              <input 
                type="text" 
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Penicillin, Peanuts"
              />
            </div>

            <button 
              type="submit" 
              disabled={creating}
              className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {creating ? <RefreshCcw className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Register Patient
            </button>
          </form>
        </motion.div>

        {/* Patients List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">Patient Directory</h2>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search patients..." className="pl-9 pr-4 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="flex justify-center p-8"><RefreshCcw className="animate-spin h-6 w-6 text-blue-500" /></div>
            ) : patients.length === 0 ? (
              <p className="text-gray-500 text-sm text-center p-8">No patients found. Register a new patient.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demographics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinical Details</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {p._id.slice(-6)}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">{p.contactNumber || 'No contact'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{p.age} yrs, <span className="capitalize">{p.gender}</span>{p.weight ? `, ${p.weight} kg` : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-900 max-w-xs truncate" title={Array.isArray(p.medicalHistory) ? p.medicalHistory.join(', ') : p.medicalHistory}>
                          <span className="font-semibold text-gray-500">History: </span>
                          {Array.isArray(p.medicalHistory) ? (p.medicalHistory.join(', ') || 'None') : (p.medicalHistory || 'None')}
                        </div>
                        <div className="text-xs text-gray-900 mt-1 max-w-xs truncate">
                          <span className="font-semibold text-gray-500">Allergies: </span>
                          {p.allergies?.length > 0 ? (
                            p.allergies.map((a: string, i: number) => (
                              <span key={i} className="inline-block bg-red-50 text-red-700 px-1.5 rounded mr-1 border border-red-100">{a}</span>
                            ))
                          ) : 'None'}
                        </div>
                        {p.currentMedications?.length > 0 && (
                          <div className="text-xs text-gray-900 mt-1 max-w-xs truncate">
                            <span className="font-semibold text-gray-500">Meds: </span>
                            {p.currentMedications.map((m: any, i: number) => (
                              <span key={i} className="inline-block bg-blue-50 text-blue-700 px-1.5 rounded mr-1 border border-blue-100" title={`${m.drugName} - ${m.dosage || ''} ${m.frequency || ''}${m.startDate ? ` (Started: ${new Date(m.startDate).toLocaleDateString()})` : ''}`}>
                                {m.drugName} 
                                {m.startDate && <span className="text-blue-500/70 text-[10px] ml-1">({new Date(m.startDate).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})})</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeletePatient(p._id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
