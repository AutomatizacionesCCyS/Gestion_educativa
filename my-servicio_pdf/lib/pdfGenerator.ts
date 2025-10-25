import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface Aprendiz {
  nombre: string;
  tipo_documento: 'TI' | 'CC' | 'CE' | 'Otro';
  numero_documento: string;
  programa_formacion: string;
  ficha_caracterizacion: string;
  centro_formacion: string;
  menor_edad: boolean;
}

interface Tutor {
  tipo_documento: string;
  numero_documento: string;
}

interface FormData {
  aprendiz: Aprendiz;
  tutor?: Tutor;
  firma_aprendiz?: string;
  firma_tutor?: string;
}

export class PDFGenerator {
  private static formatearNumeroDocumento(numero: string): string {
  // Remover cualquier separador existente y formatear
  const numeroLimpio = numero.replace(/\D/g, '');
  
  // Formatear con separadores de miles
  return numeroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
  static async createActaCompromiso(formData: FormData): Promise<Uint8Array> {
    try {
      // 1. Cargar plantilla base desde el sistema de archivos
      const templatePath = path.join(process.cwd(), 'public', 'acta-compromiso-plantilla.pdf');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`No se encontró la plantilla en: ${templatePath}`);
      }

      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 2. Insertar datos del aprendiz
      this.insertarDatosAprendiz(firstPage, formData.aprendiz, font, fontBold);

      // 3. Insertar datos del tutor si es menor
      if (formData.tutor && formData.aprendiz.menor_edad) {
        this.insertarDatosTutor(firstPage, formData.tutor, font, fontBold);
      }

      // 4. Insertar firmas
      if (formData.firma_aprendiz) {
        await this.insertarFirma(pdfDoc, firstPage, formData.firma_aprendiz, 190, 250);
      }

      if (formData.firma_tutor && formData.aprendiz.menor_edad) {
        await this.insertarFirma(pdfDoc, firstPage, formData.firma_tutor, 190, 180);
      }

      // 5. Insertar fecha actual
      this.insertarFecha(firstPage, font);

      return await pdfDoc.save();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  // Los demás métodos se mantienen igual...
  private static async insertarFirma(pdfDoc: PDFDocument, page: PDFPage, firmaBase64: string, x: number, y: number) {
    try {
      // Limpiar el data URL y convertir
      const base64Data = firmaBase64.split(',')[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      let image;
      if (firmaBase64.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      // Redimensionar firma
      const scale = 0.2;
      const { width, height } = image.scale(scale);
      
      page.drawImage(image, {
        x: x,
        y: y,
        width: width,
        height: height,
      });
    } catch (error) {
      console.error('Error insertando firma:', error);
    }
  }

  private static insertarDatosAprendiz(page: PDFPage, aprendiz: Aprendiz, font: PDFFont, fontBold: PDFFont) {
    const { height } = page.getSize();

      // NOMBRE COMPLETO - después de "Yo,"
    page.drawText(aprendiz.nombre, {
        x: 85,  // Ajustado a la derecha de "Yo,"
        y: height - 85,  // Misma línea que "Yo,"
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

      // MARCAR TIPO DE DOCUMENTO CON "X"
      const tipoDocX: Record<'TI' | 'CC' | 'CE' | 'Otro', number> = {
        'TI': 220,   // Tarjeta de Identidad
        'CC': 305,  // Cédula de Ciudadanía  
        'CE': 395,  // Cédula de Extranjería
        'Otro': 220 // Otro
      };

      if (tipoDocX[aprendiz.tipo_documento]) {
        page.drawText('X', {
          x: tipoDocX[aprendiz.tipo_documento],
          y: height - 108,  // Línea de tipos de documento
          size: 12,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      }

    // NÚMERO DE DOCUMENTO - al final de la línea (CON FORMATO)
    page.drawText(this.formatearNumeroDocumento(aprendiz.numero_documento), {
      x: 460,
      y: height - 118,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

      // PROGRAMA DE FORMACIÓN
    page.drawText(aprendiz.programa_formacion, {
        x: 245,
        y: height - 147,  // Después de "Matriculado en..."
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

      // FICHA DE CARACTERIZACIÓN
    page.drawText(aprendiz.ficha_caracterizacion, {
        x: 150,
        y: height - 170,  // Después de "Ficha de Caracterización No."
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

      // CENTRO DE FORMACIÓN
    page.drawText(aprendiz.centro_formacion, {
        x: 340,
        y: height - 168,  // Después de "Del Centro de Formación:"
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

      // NÚMERO DE DOCUMENTO EN SECCIÓN DE FIRMAS (parte inferior - CON FORMATO)
      page.drawText(this.formatearNumeroDocumento(aprendiz.numero_documento), {
        x: 400,
        y: 246,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
  });
  }

  private static insertarDatosTutor(page: PDFPage, tutor: Tutor, font: PDFFont, fontBold: PDFFont) {
    const { height } = page.getSize();

    page.drawText(`${tutor.tipo_documento} - ${this.formatearNumeroDocumento(tutor.numero_documento)}`, {
      x: 300,
      y: height - 550,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  private static insertarFecha(page: PDFPage, font: PDFFont) {
    const { height } = page.getSize();
    
    const fecha = new Date();
    const dia = fecha.getDate().toString();
    const mes = (fecha.getMonth() + 1).toString();
    const anio = fecha.getFullYear().toString();

    page.drawText(dia, {
      x: 300,
      y: height - 661,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(mes, {
      x: 400,
      y: height - 661,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(anio, {
      x: 500,
      y: height - 661,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
}