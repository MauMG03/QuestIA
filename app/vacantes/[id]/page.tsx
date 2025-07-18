// app/vacantes/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebaseConfig';
import { ArrowLeft, Edit, Save, X, Plus, User, Download } from 'lucide-react';
import Link from 'next/link';
import CrearCandidatoModal from '../../../components/CrearCandidatoModal';
import Header from '@/components/Header';

// --- Interfaces (sin cambios) ---
interface Vacante {
  puesto: string;
  descripcion: string;
  estado: string;
  candidatos: number;
  fechaCreacion?: Date;
}

interface Candidato {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cvUrl: string;
}

interface NuevoCandidatoData {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cvUrl: string;
}

export default function PaginaGestionVacante() {
  const params = useParams();
  const id = params.id as string;

  // --- Estados y Lógica (sin cambios) ---
  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Vacante, 'candidatos' | 'fechaCreacion'>>({
    puesto: '',
    descripcion: '',
    estado: 'Abierta',
  });
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;
      setLoading(true);
      // Fetch de la vacante
      const docRef = doc(firestore, 'vacantes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Vacante;
        setVacante(data);
        setFormData({
          puesto: data.puesto,
          descripcion: data.descripcion,
          estado: data.estado,
        });
      }
      // Fetch de los candidatos
      const candidatosRef = collection(firestore, 'vacantes', id, 'candidatos');
      const snapshot = await getDocs(candidatosRef);
      const listaCandidatos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidato));
      setCandidatos(listaCandidatos);
      setLoading(false);
    };
    fetchAllData();
  }, [id]);

  const handleCrearCandidato = async (candidatoData: NuevoCandidatoData) => {
    if (!id) return;
    try {
      const candidatosRef = collection(firestore, 'vacantes', id, 'candidatos');
      const docRef = await addDoc(candidatosRef, candidatoData);
      setCandidatos(prev => [...prev, { id: docRef.id, ...candidatoData }]);
    } catch (error) {
      console.error("Error al crear candidato:", error);
      throw error;
    }
  };
  
  const handleSaveChanges = async () => {
    if (!id) return;
    const vacanteDocRef = doc(firestore, 'vacantes', id);
    try {
      await updateDoc(vacanteDocRef, { ...formData });
      setVacante(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la vacante: ", error);
    }
  };

  const handleCancelEdit = () => {
    if (vacante) {
      setFormData({
        puesto: vacante.puesto,
        descripcion: vacante.descripcion,
        estado: vacante.estado,
      });
    }
    setIsEditing(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <p className="text-center p-10">Cargando datos de la vacante...</p>;
  }

  return (
    <>
      <Header />
      <CrearCandidatoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCrear={handleCrearCandidato}
        vacanteId={id}
      />

      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <header className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
            <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-4 shadow"
              >
                <ArrowLeft size={20} />
                Volver al Dashboard
              </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Vacante</h1>
          <p className="text-md text-gray-500">{vacante?.puesto}</p>
        </header>

        {/* ================================================================== */}
        {/* SECCIÓN 1: DETALLES DE LA VACANTE                    */}
        {/* ================================================================== */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Información de la Vacante</h2>
            {isEditing ? (
              <div className="flex gap-2">
                <button onClick={handleSaveChanges} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                  <Save size={18} /> Guardar
                </button>
                <button onClick={handleCancelEdit} className="flex items-center gap-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors">
                  <X size={18} /> Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                <Edit size={18} /> Editar
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {/* Formulario de edición */}
              <div>
                <label htmlFor="puesto" className="block text-sm font-medium text-gray-700">Puesto</label>
                <input type="text" name="puesto" id="puesto" value={formData.puesto} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                <select name="estado" id="estado" value={formData.estado} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Vista de detalles */}
              <p className="text-gray-600 whitespace-pre-wrap">{vacante?.descripcion}</p>
              <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${vacante?.estado === 'Abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {vacante?.estado}
              </span>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN 2: GESTIÓN DE CANDIDATOS                    */}
        {/* ================================================================== */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Candidatos</h2>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
              <Plus size={18} /> Añadir Candidato
            </button>
          </div>
          <div className="space-y-4">
            {candidatos.length > 0 ? (
              candidatos.map(candidato => (
                <div key={candidato.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full"><User className="text-blue-600" /></div>
                    <div>
                      <p className="font-bold">{candidato.nombre} {candidato.apellido}</p>
                      <p className="text-sm text-gray-600">{candidato.correo}</p>
                    </div>
                  </div>
                  <a href={candidato.cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                    <Download size={16} /> Ver CV
                  </a>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Aún no hay candidatos para esta vacante.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}