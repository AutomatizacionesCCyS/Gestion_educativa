import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator } from '../../../lib/pdfGenerator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    console.log('📨 Datos recibidos en API:', formData);

    const pdfBytes = await PDFGenerator.createPdf(formData);

    // Crear respuesta con el PDF - CORREGIDO: usar Buffer.from()
    const response = new NextResponse(Buffer.from(pdfBytes));
    
    // Configurar headers para descarga
    response.headers.set('Content-Type', 'application/pdf');
    
    const fileName = formData.formato === 'tratamiento'
      ? `tratamiento-datos-${formData.aprendiz.nombre}.pdf`
      : `acta-compromiso-${formData.aprendiz.nombre}.pdf`;
    
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    console.log(`✅ PDF generado exitosamente: ${fileName}`);
    return response;

  } catch (error) {
    console.error('❌ Error en API:', error);
    return NextResponse.json(
      { error: 'Error generando PDF: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    );
  }
}

// Opcional: agregar otros métodos HTTP si son necesarios
export async function GET() {
  return NextResponse.json({ message: 'Método GET no disponible. Use POST.' }, { status: 405 });
}