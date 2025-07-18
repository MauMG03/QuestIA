// components/CrearCandidatoModal.jsx
'use client';

import React, { useState } from 'react';
import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Loader } from 'lucide-react';

interface NuevoCandidatoData {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cvUrl: string; // URL del CV en Firebase Storage
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // La función onCrear ahora recibe los datos del candidato
  onCrear: (candidatoData: NuevoCandidatoData) => Promise<void>;
  vacanteId: string;
}

export default function CrearCandidatoModal({ isOpen, onClose, onCrear, vacanteId }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar que sea un PDF
      if(file.type === "application/pdf") {
        setCvFile(file);
        setError('');
      } else {
        setError('Por favor, selecciona un archivo PDF.');
        setCvFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      setError('El archivo del CV es obligatorio.');
      return;
    }
    
    setIsUploading(true);
    setError('');

    try {
      // 1. Crear referencia en Firebase Storage
      // Usamos el ID de la vacante para organizar los CVs
      const storageRef = ref(storage, `cvs/${vacanteId}/${Date.now()}_${cvFile.name}`);
      
      // 2. Subir el archivo
      const uploadResult = await uploadBytes(storageRef, cvFile);
      
      // 3. Obtener la URL de descarga
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 4. Llamar a la función onCrear con todos los datos
      await onCrear({
        nombre,
        apellido,
        correo,
        telefono,
        cvUrl: downloadURL,
      });

      // 5. Limpiar formulario y cerrar modal
      setNombre(''); setApellido(''); setCorreo(''); setTelefono(''); setCvFile(null);
      onClose();

    } catch (err) {
      console.error("Error al subir el archivo o crear el candidato:", err);
      setError("No se pudo crear el candidato. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Añadir Nuevo Candidato</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... campos del formulario ... */}
          <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full p-2 border rounded" />
          <input type="email" placeholder="Correo Electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full p-2 border rounded" />
          <input type="tel" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CV (PDF)</label>
            <input type="file" accept="application/pdf" onChange={handleFileChange} required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={isUploading} className="py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
              {isUploading ? <Loader className="animate-spin" size={20} /> : null}
              {isUploading ? 'Guardando...' : 'Crear Candidato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}