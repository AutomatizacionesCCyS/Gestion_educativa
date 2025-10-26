"use client";
import { useState } from 'react'
import { DigitalSignature } from '../components/DigitalSignature';

interface Aprendiz {
  id: string;
  nombre: string;
  tipo_documento: 'TI' | 'CC' | 'CE' | 'Otro';
  otro_tipo?: string;
  numero_documento: string;
  programa_formacion: string;
  ficha_caracterizacion: string;
  centro_formacion: string;
  menor_edad: boolean;
  fecha_matricula: string;
}

interface DatosTutor {
  tipo_documento: string;
  numero_documento: string;
  parentesco: string;
  email: string;
  direccion: string;
}

export default function Home() {
  const [tutorData, setTutorData] = useState<DatosTutor>({
    tipo_documento: 'CC',
    numero_documento: '987654321',
    parentesco: 'Padre',
    email: 'tutor@example.com',
    direccion: 'Calle 123 # 45-67, Popayán, Cauca'
  })

  const [firmaAprendiz, setFirmaAprendiz] = useState('')
  const [firmaTutor, setFirmaTutor] = useState('')
  const [generando, setGenerando] = useState(false)

  // Función para determinar automáticamente si es menor de edad
  const determinarMenorEdad = (tipoDocumento: 'TI' | 'CC' | 'CE' | 'Otro'): boolean => {
    return tipoDocumento === 'TI'; // Solo TI es menor de edad
  }

  // DATOS SIMULADOS DEL APRENDIZ
  const tipoDocumentoSimulado: 'TI' | 'CC' | 'CE' | 'Otro' = 'TI'; // CAMBIA AQUÍ para probar
  const esMenorEdad = determinarMenorEdad(tipoDocumentoSimulado);

  const datosAprendiz: Aprendiz = {
    id: "1",
    nombre: "MARÍA FERNANDA GÓMEZ",
    tipo_documento: tipoDocumentoSimulado,
    otro_tipo: tipoDocumentoSimulado === 'Otro' ? 'Pasaporte' : undefined,
    numero_documento: "1123456789",
    programa_formacion: "Tecnólogo en Análisis y Desarrollo de Software",
    ficha_caracterizacion: "2668599",
    centro_formacion: "Centro de Comercio y Servicios - Popayán",
    menor_edad: esMenorEdad,
    fecha_matricula: "2024-01-15"
  }

  const descargarPDF = async (tipo: 'acta' | 'tratamiento') => {
  if (!firmaAprendiz) {
    alert('Debe agregar su firma digital')
    return
  }

  if (tipo === 'tratamiento' && !firmaTutor) {
    alert('Debe agregar la firma del tutor')
    return
  }

  setGenerando(true)

  try {
    const formData = {
      aprendiz: datosAprendiz,
      tutor: datosAprendiz.menor_edad ? tutorData : undefined,
      firma_aprendiz: firmaAprendiz,
      firma_tutor: datosAprendiz.menor_edad ? firmaTutor : undefined,
      formato: tipo
    }

    console.log(`Generando ${tipo}...`, formData)
    
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
      
      const nombreArchivo = tipo === 'tratamiento' 
        ? `tratamiento-datos-${datosAprendiz.nombre}.pdf`
        : `acta-compromiso-${datosAprendiz.nombre}.pdf`
      
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert(tipo === 'tratamiento' 
        ? 'Formato de Tratamiento de Datos generado y descargado exitosamente!' 
        : 'Acta de Compromiso generada y descargada exitosamente!'
      )
    } else {
      // CORREGIR ESTA PARTE - hacer la función async
      const errorText = await response.text()
      throw new Error(`Error al generar PDF: ${errorText}`)
    }

  } catch (error) {
    console.error('Error:', error)
    alert('Error al generar el PDF: ' + error.message)
  } finally {
    setGenerando(false)
  }
}

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '10px' }}>Sistema de Formatos SENA</h1>
      <p style={{ color: '#7f8c8d', textAlign: 'center', marginBottom: '30px' }}>Generación de documentos para aprendices</p>
      
      {/* DATOS DEL APRENDIZ */}
      <div style={{ 
        backgroundColor: '#2c3e50',
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '25px',
        border: '2px solid #34495e'
      }}>
        <h3 style={{ color: 'white', marginBottom: '15px', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
          📝 Datos del Aprendiz (simulados)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Nombre:</strong> {datosAprendiz.nombre}</p>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Documento:</strong> {datosAprendiz.tipo_documento} {datosAprendiz.tipo_documento === 'Otro' && `- ${datosAprendiz.otro_tipo}`} - {datosAprendiz.numero_documento}</p>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Programa:</strong> {datosAprendiz.programa_formacion}</p>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Ficha:</strong> {datosAprendiz.ficha_caracterizacion}</p>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Centro:</strong> {datosAprendiz.centro_formacion}</p>
          <p style={{ color: 'white', margin: '8px 0' }}><strong>Menor de edad:</strong> 
            <span style={{ 
              color: datosAprendiz.menor_edad ? '#ff6b6b' : '#51cf66', 
              fontWeight: 'bold',
              marginLeft: '10px',
              fontSize: '16px'
            }}>
              {datosAprendiz.menor_edad ? 'SÍ' : 'NO'}
            </span>
          </p>
        </div>
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          backgroundColor: datosAprendiz.menor_edad ? '#fff3cd' : '#d1ecf1',
          borderRadius: '5px',
          border: `2px solid ${datosAprendiz.menor_edad ? '#ffc107' : '#17a2b8'}`
        }}>
          <strong style={{ color: datosAprendiz.menor_edad ? '#856404' : '#0c5460' }}>
            {datosAprendiz.menor_edad 
              ? '📋🔒 Formatos disponibles: Acta de Compromiso + Tratamiento de Datos' 
              : '📄 Formato disponible: Acta de Compromiso'
            }
          </strong>
        </div>
      </div>

      {/* DATOS DEL TUTOR (SOLO SI ES MENOR) */}
      {datosAprendiz.menor_edad && (
        <div style={{ 
          backgroundColor: '#fff9e6', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '25px', 
          border: '3px solid #ffd54f'
        }}>
          <h3 style={{ color: '#e67e22', marginBottom: '20px', borderBottom: '2px solid #e67e22', paddingBottom: '5px' }}>
            👨‍👩‍👧‍👦 Datos para Formato de Tratamiento de Datos (Menor de Edad)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                Tipo Documento Tutor:
              </label>
              <select 
                value={tutorData.tipo_documento}
                onChange={(e) => setTutorData({...tutorData, tipo_documento: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #bdc3c7',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                Número Documento Tutor:
              </label>
              <input 
                type="text" 
                value={tutorData.numero_documento}
                onChange={(e) => setTutorData({...tutorData, numero_documento: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #bdc3c7',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                Parentesco:
              </label>
              <select 
                value={tutorData.parentesco}
                onChange={(e) => setTutorData({...tutorData, parentesco: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #bdc3c7',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor">Tutor</option>
                <option value="Acudiente">Acudiente</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                Email Tutor:
              </label>
              <input 
                type="email" 
                value={tutorData.email}
                onChange={(e) => setTutorData({...tutorData, email: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #bdc3c7',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                placeholder="tutor@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              Dirección de Contacto:
            </label>
            <input 
              type="text" 
              value={tutorData.direccion}
              onChange={(e) => setTutorData({...tutorData, direccion: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '2px solid #bdc3c7',
                borderRadius: '5px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
              placeholder="Dirección completa"
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '25px' }}>
        {/* FIRMA DEL APRENDIZ */}
        <DigitalSignature 
          titulo={datosAprendiz.menor_edad ? "✍️ Firma del Aprendiz (Para ambos formatos)" : "✍️ Firma del Aprendiz"}
          onFirmaChange={setFirmaAprendiz}
        />
      </div>

      {/* FIRMA DEL TUTOR (SOLO SI ES MENOR) */}
      {datosAprendiz.menor_edad && (
        <div style={{ marginBottom: '25px' }}>
          <DigitalSignature 
            titulo="✍️ Firma del Padre/Madre/Tutor (Para formato de Tratamiento)"
            onFirmaChange={setFirmaTutor}
          />
        </div>
      )}

      {/* BOTONES SEPARADOS PARA CADA FORMATO */}
      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {/* BOTÓN ACTA DE COMPROMISO (SIEMPRE DISPONIBLE) */}
        <button 
          onClick={() => descargarPDF('acta')}
          style={{ 
            padding: '15px 30px', 
            fontSize: '16px', 
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            opacity: (!firmaAprendiz || generando) ? 0.6 : 1,
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease'
          }}
          disabled={!firmaAprendiz || generando}
          onMouseOver={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {generando ? '⏳ Generando...' : '📄 Descargar Acta de Compromiso'}
        </button>

        {/* BOTÓN TRATAMIENTO DE DATOS (SOLO SI ES MENOR) */}
        {datosAprendiz.menor_edad && (
          <button 
            onClick={() => descargarPDF('tratamiento')}
            style={{ 
              padding: '15px 30px', 
              fontSize: '16px', 
              backgroundColor: '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: (!firmaAprendiz || !firmaTutor || generando) ? 0.6 : 1,
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            disabled={!firmaAprendiz || !firmaTutor || generando}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {generando ? '⏳ Generando...' : '📋 Descargar Formato Tratamiento de Datos'}
          </button>
        )}
      </div>
    </div>
  )
}