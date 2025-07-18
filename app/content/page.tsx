import Header from '../../components/Header'
import Content from '../../components/Content'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div>Cargando...</div>}>
        <Content />
      </Suspense>
    </div>
  )
}