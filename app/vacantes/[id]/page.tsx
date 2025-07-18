'use client';

import React, { useState, useEffect } from 'react';
// 1. Importa useParams
import { useParams } from 'next/navigation'; 
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebaseConfig'; // Ajusta la ruta a tu config de Firebase
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import Header from '@/components/Header';

// Reutilizamos la interfaz que ya definiste
interface Vacante {
  id: string;
  puesto: string;
  descripcion: string;
  estado: string;
  candidatos: number;
  fechaCreacion?: Date;
}

// 2. Elimina `params` de las props
export default function PaginaGestionVacante() { 
  // 3. Usa el hook para obtener el id
  const params = useParams();
  const id = params.id as string; // Obtenemos el ID y lo tratamos como string

  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchVacante = async () => {
        setLoading(true);
        const docRef = doc(firestore, 'vacantes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVacante({
            id: docSnap.id,
            puesto: data.puesto,
            descripcion: data.descripcion,
            estado: data.estado,
            candidatos: data.candidatos,
            fechaCreacion: data.fechaCreacion?.toDate(),
          });
        } else {
          console.error("No se encontró la vacante!");
        }
        setLoading(false);
      };

      fetchVacante();
    }
  }, [id]);

  // ... el resto de tu componente no necesita cambios
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
            <Link href="/dashboard">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-4 shadow"
              >
                <ArrowLeft size={20} />
                Volver al Dashboard
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{vacante.puesto}</h1>
            <p className="text-md text-gray-500">{vacante.descripcion}</p>
            <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${vacante.estado === 'Abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {vacante.estado}
            </span>
        </header>

        <main>
            <h2 className="text-2xl font-semibold text-gray-700">Panel de Gestión</h2>
            <p className="mt-2 text-gray-600">
            Próximamente: Aquí podrás ver la lista de candidatos, agendar entrevistas y más.
            </p>
        </main>
        </div>
    </>
  );
}