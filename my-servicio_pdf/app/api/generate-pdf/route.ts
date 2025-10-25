import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator } from '../../../lib/pdfGenerator'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    
    // Generar PDF
    const pdfBytes = await PDFGenerator.createActaCompromiso(formData)
    
    // Devolver como respuesta
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="acta-compromiso.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}