'use client'
import { useState } from 'react'
import { Aprendiz, DatosTutor } from '../lib/types'
import { DigitalSignature } from '../components/DigitalSignature'

export default function Home() {
  const [tutorData, setTutorData] = useState<DatosTutor>({
    tipo_documento: '',
    numero_documento: '',
    parentesco: ''
  })

  const [esMenorEdad, setEsMenorEdad] = useState(false)
  const [firmaAprendiz, setFirmaAprendiz] = useState('')
  const [firmaTutor, setFirmaTutor] = useState('')

  // ESTOS DATOS VIENEN DE LA BASE DE DATOS (por ahora simulados)
  const datosAprendiz: Aprendiz = {
    id: "1",
    nombre: "MARÍA FERNANDA GÓMEZ",
    tipo_documento: "Otro",
    numero_documento: "1123456789",
    programa_formacion: "Tecnólogo en Análisis y Desarrollo de Software",
    ficha_caracterizacion: "2668599",
    centro_formacion: "Centro de Comercio y Servicios - Popayán",
    menor_edad: false,
    fecha_matricula: "2024-01-15"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firmaAprendiz) {
      alert('Debe agregar su firma digital')
      return
    }

    if (esMenorEdad && !firmaTutor) {
      alert('Debe agregar la firma del tutor')
      return
    }

    try {
      const formData = {
        aprendiz: datosAprendiz,
        tutor: esMenorEdad ? tutorData : undefined,
        firma_aprendiz: firmaAprendiz,
        firma_tutor: esMenorEdad ? firmaTutor : undefined
      }

      console.log('Generando PDF...')
      
      // Llamar a la API para generar PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `acta-compromiso-${datosAprendiz.nombre}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        alert('PDF generado y descargado exitosamente!')
      } else {
        throw new Error('Error al generar PDF')
      }

    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar el PDF')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Acta de Compromiso SENA</h1>
      <p style={{ color: '#666' }}>Formato GFPI-F-015 V.3</p>
      
      {/* DATOS DEL APRENDIZ (SOLO LECTURA) */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Datos del Aprendiz (desde base de datos)</h3>
        <p><strong>Nombre:</strong> {datosAprendiz.nombre}</p>
        <p><strong>Documento:</strong> {datosAprendiz.tipo_documento} - {datosAprendiz.numero_documento}</p>
        <p><strong>Programa:</strong> {datosAprendiz.programa_formacion}</p>
        <p><strong>Ficha:</strong> {datosAprendiz.ficha_caracterizacion}</p>
        <p><strong>Centro:</strong> {datosAprendiz.centro_formacion}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* DATOS DEL TUTOR (SOLO SI ES MENOR) */}
        <div style={{ marginBottom: '20px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={esMenorEdad}
              onChange={(e) => setEsMenorEdad(e.target.checked)}
            />
            ¿Es menor de edad? (requiere datos del tutor)
          </label>
        </div>

        {esMenorEdad && (
          <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Datos del Padre/Madre/Tutor</h3>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Tipo de Documento: </label>
              <select 
                value={tutorData.tipo_documento}
                onChange={(e) => setTutorData({...tutorData, tipo_documento: e.target.value})}
                required
              >
                <option value="">Seleccionar</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Número de Documento: </label>
              <input 
                type="text" 
                value={tutorData.numero_documento}
                onChange={(e) => setTutorData({...tutorData, numero_documento: e.target.value})}
                required
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Parentesco: </label>
              <input 
                type="text" 
                value={tutorData.parentesco}
                onChange={(e) => setTutorData({...tutorData, parentesco: e.target.value})}
                placeholder="Padre, Madre, Tutor..."
                required
              />
            </div>
          </div>
        )}

        {/* FIRMA DEL APRENDIZ */}
        <DigitalSignature 
          titulo="Firma del Aprendiz"
          onFirmaChange={setFirmaAprendiz}
        />

        {/* FIRMA DEL TUTOR (SOLO SI ES MENOR) */}
        {esMenorEdad && (
          <DigitalSignature 
            titulo="Firma del Padre/Madre/Tutor"
            onFirmaChange={setFirmaTutor}
          />
        )}

        <button 
          type="submit" 
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
          disabled={!firmaAprendiz || (esMenorEdad && !firmaTutor)}
        >
          Generar PDF del Acta
        </button>
      </form>
    </div>
  )
}