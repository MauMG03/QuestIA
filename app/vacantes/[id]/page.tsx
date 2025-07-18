// app/vacantes/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// Importamos updateDoc para guardar los cambios
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebaseConfig';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

interface Vacante {
  puesto: string;
  descripcion: string;
  estado: string;
  candidatos: number;
  fechaCreacion?: Date;
}

export default function PaginaGestionVacante() {
  const params = useParams();
  const id = params.id as string;

  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVOS ESTADOS PARA LA EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);
  // Guardamos los datos del formulario por separado
  const [formData, setFormData] = useState<Omit<Vacante, 'candidatos' | 'fechaCreacion'>>({
    puesto: '',
    descripcion: '',
    estado: 'Abierta',
  });

  // --- FUNCIÓN PARA CARGAR DATOS ---
  const fetchVacante = async () => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(firestore, 'vacantes', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Vacante;
      setVacante(data);
      // Pre-llenamos el formulario con los datos existentes
      setFormData({
        puesto: data.puesto,
        descripcion: data.descripcion,
        estado: data.estado,
      });
    } else {
      console.error("No se encontró la vacante!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVacante();
  }, [id]);

  // --- NUEVAS FUNCIONES PARA MANEJAR EL FORMULARIO ---

  // Actualiza el estado del formulario cada vez que el usuario escribe
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para guardar los cambios en Firestore
  const handleSaveChanges = async () => {
    if (!id) return;
    
    const vacanteDocRef = doc(firestore, 'vacantes', id);
    try {
      await updateDoc(vacanteDocRef, {
        puesto: formData.puesto,
        descripcion: formData.descripcion,
        estado: formData.estado,
      });
      // Actualizamos el estado local para reflejar los cambios al instante
      setVacante(prev => prev ? { ...prev, ...formData } : null);
      // Salimos del modo de edición
      setIsEditing(false);
      console.log("¡Vacante actualizada con éxito!");
    } catch (error) {
      console.error("Error al actualizar la vacante: ", error);
    }
  };
  
  // Función para cancelar la edición y restaurar los datos originales
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


  if (loading) {
    return <p className="text-center p-10">Cargando detalles de la vacante...</p>;
  }

  if (!vacante) {
    return <p className="text-center p-10 text-red-500">Error: No se pudo cargar la vacante.</p>;
  }

  return (
    <>
    <Header />
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
        
        {/* --- RENDERIZADO CONDICIONAL: VISTA O FORMULARIO --- */}
        {isEditing ? (
          // MODO FORMULARIO
          <div className="space-y-4">
            <div>
              <label htmlFor="puesto" className="block text-sm font-medium text-gray-700">Puesto</label>
              <input
                type="text"
                name="puesto"
                id="puesto"
                value={formData.puesto}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              />
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="descripcion"
                id="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
              <select 
                name="estado" 
                id="estado"
                value={formData.estado} 
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Abierta">Abierta</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>
          </div>
        ) : (
          // MODO VISTA
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{vacante.puesto}</h1>
            <p className="text-md text-gray-500 mt-2 whitespace-pre-wrap">{vacante.descripcion}</p>
            <span className={`mt-4 inline-block px-3 py-1 text-sm font-semibold rounded-full ${vacante.estado === 'Abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {vacante.estado}
            </span>
          </div>
        )}
      </header>

      <main className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Panel de Gestión</h2>
            
            {/* --- BOTONES DE ACCIÓN --- */}
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
                <Edit size={18} /> Editar Vacante
              </button>
            )}
        </div>
        
        {/* Aquí podrás añadir más funcionalidades, como la lista de candidatos */}
        <p className="mt-2 text-gray-600">
            Próximamente: Aquí podrás ver la lista de candidatos, agendar entrevistas y más.
        </p>
      </main>
    </div>
    </>
  );
}