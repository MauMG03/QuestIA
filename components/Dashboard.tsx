// components/DashboardVacantes.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebaseConfig'; 
import { Plus } from 'lucide-react';
import CrearVacanteModal from './CrearVacanteModal';
import VacanteCard from './VacanteCard'; // Importa el nuevo componente

// Define the type for a new vacante
interface NuevaVacante {
  puesto: string;
  descripcion: string;
}

interface Vacante extends NuevaVacante {
  id: string;
  estado: string;
  candidatos: number;
  fechaCreacion?: Date;
}

export default function DashboardVacantes() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

// Función para obtener los datos de Firestore
const fetchVacantes = async () => {
    setLoading(true);
    const vacantesCollection = collection(firestore, 'vacantes');
    const vacantesSnapshot = await getDocs(vacantesCollection);
    const vacantesList = vacantesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            puesto: data.puesto,
            descripcion: data.descripcion,
            estado: data.estado,
            candidatos: data.candidatos,
            fechaCreacion: data.fechaCreacion ? (data.fechaCreacion.toDate ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion)) : undefined,
        } as Vacante;
    });
    setVacantes(vacantesList);
    console.log(vacantesList);
    setLoading(false);
};

// Cargar vacantes al montar el componente
    useEffect(() => {
        fetchVacantes();
    }, []);

  // useEffect para cargar los datos cuando el componente se monta
  // CREATE: Añadir una nueva vacante a Firestore
  const handleCrearVacante = async (nuevaVacante: NuevaVacante) => {
    try {
      const docRef = await addDoc(collection(firestore, 'vacantes'), {
        puesto: nuevaVacante.puesto,
        descripcion: nuevaVacante.descripcion,
        estado: 'Abierta',
        candidatos: 0,
        fechaCreacion: new Date(),
      });
      console.log("Vacante creada con ID: ", docRef.id);
      // Actualiza el estado local para reflejar el cambio al instante
      setVacantes([{ id: docRef.id, ...nuevaVacante, estado: 'Abierta', candidatos: 0 }, ...vacantes]);
    } catch (e) {
      console.error("Error al añadir documento: ", e);
    }
  };

  // UPDATE: Cambiar el estado de una vacante
  const handleUpdateStatus = async (id: string | number, newStatus: string) => {
    const stringId = String(id);
    const vacanteDoc = doc(firestore, 'vacantes', stringId);
    try {
      await updateDoc(vacanteDoc, { estado: newStatus });
      // Actualiza el estado local
      setVacantes(vacantes.map(v => (v.id === stringId ? { ...v, estado: newStatus } : v)));
    } catch (e) {
      console.error("Error al actualizar: ", e);
    }
  };

  // DELETE: Eliminar una vacante de Firestore
  const handleEliminar = async (id: string | number) => {
    const stringId = String(id);
    if (window.confirm("¿Estás seguro de que quieres eliminar esta vacante?")) {
      try {
        await deleteDoc(doc(firestore, 'vacantes', stringId));
        // Actualiza el estado local para quitar el elemento
        setVacantes(vacantes.filter(v => v.id !== stringId));
      } catch (e) {
        console.error("Error al eliminar documento: ", e);
      }
    }
  };

  return (
    <>
      <CrearVacanteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCrear={handleCrearVacante}
      />

      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard de Vacantes</h1>
            <p className="text-md text-gray-500 mt-1">Gestiona tus puestos y procesos de selección.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Crear Nueva Vacante
          </button>
        </header>

        <main>
          {loading ? (
            <p className="text-center text-gray-500">Cargando vacantes...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vacantes.map((vacante) => (
                <VacanteCard
                  key={vacante.id}
                  vacante={vacante}
                  onDelete={handleEliminar}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}