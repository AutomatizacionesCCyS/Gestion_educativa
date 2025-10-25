'use client'
import React, { useRef, useState, useCallback } from 'react'

interface DigitalSignatureProps {
  onFirmaChange: (firmaData: string) => void
  titulo: string
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({ 
  onFirmaChange, 
  titulo 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    
    // Configurar estilo del pincel
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }, [])

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    saveFirma()
  }, [])

  const saveFirma = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const firmaData = canvas.toDataURL('image/png')
    onFirmaChange(firmaData)
  }, [onFirmaChange])

  const clearFirma = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onFirmaChange('')
  }, [onFirmaChange])

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>{titulo}</h4>
      <div style={{ border: '2px dashed #ccc', borderRadius: '5px', padding: '10px' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{ 
            border: '1px solid #ddd', 
            backgroundColor: '#f9f9f9',
            cursor: 'crosshair',
            display: 'block',
            margin: '0 auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <button 
        type="button" 
        onClick={clearFirma}
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Limpiar Firma
      </button>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        Dibuje su firma en el área superior
      </p>
    </div>
  )
}