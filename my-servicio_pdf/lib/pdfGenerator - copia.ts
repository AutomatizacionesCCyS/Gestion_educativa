import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface Aprendiz {
  nombre: string;
  tipo_documento: 'TI' | 'CC' | 'CE' | 'Otro';
  otro_tipo?: string;
  numero_documento: string;
  programa_formacion: string;
  ficha_caracterizacion: string;
  centro_formacion: string;
  menor_edad: boolean;
}

interface Tutor {
  tipo_documento: string;
  numero_documento: string;
  parentesco: string;
  email: string;
  direccion: string;
}

interface FormData {
  aprendiz: Aprendiz;
  tutor?: Tutor;
  firma_aprendiz?: string;
  firma_tutor?: string;
  formato: 'acta' | 'tratamiento' | 'ambos';
}

export class PDFGenerator {
  private static formatearNumeroDocumento(numero: string): string {
    const numeroLimpio = numero.replace(/\D/g, '');
    return numeroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  static async createPdf(formData: FormData): Promise<Uint8Array> {
    try {
      // Generar el formato específico solicitado
      if (formData.formato === 'tratamiento') {
        return await this.createFormatoTratamientoDatos(formData);
      } else {
        return await this.createActaCompromiso(formData);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  // MÉTODO NUEVO PARA EL FORMATO DE TRATAMIENTO DE DATOS
  static async createFormatoTratamientoDatos(formData: FormData): Promise<Uint8Array> {
    if (!formData.tutor) {
      throw new Error('Datos del tutor requeridos para formato de tratamiento de datos');
    }

    const templatePath = path.join(process.cwd(), 'public', 'form-tratamiento-datos.pdf');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`No se encontró la plantilla en: ${templatePath}`);
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Insertar datos en el formato de tratamiento de datos
    this.insertarDatosTratamiento(pdfDoc, firstPage, formData, font, fontBold);

    return await pdfDoc.save();
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

    // DEBUG: Verificar datos del tutor
    console.log('🔍 DEBUG Acta - Datos aprendiz:', formData.aprendiz);
    console.log('🔍 DEBUG Acta - Es menor de edad?:', formData.aprendiz.menor_edad);
    console.log('🔍 DEBUG Acta - Datos tutor:', formData.tutor);
    console.log('🔍 DEBUG Acta - Firma tutor existe?:', !!formData.firma_tutor);

    // 2. Insertar datos del aprendiz
    this.insertarDatosAprendiz(firstPage, formData.aprendiz, font, fontBold);

    // 3. Insertar datos del tutor si es menor
    if (formData.tutor && formData.aprendiz.menor_edad) {
      console.log('✅ INSERTANDO datos del tutor en Acta');
      this.insertarDatosTutor(firstPage, formData.tutor, font, fontBold);
    } else {
      console.log('❌ NO se insertan datos del tutor - Razón:', 
        !formData.tutor ? 'No hay datos tutor' : 'No es menor de edad');
    }

    // 4. Insertar firmas
    if (formData.firma_aprendiz) {
      console.log('✅ INSERTANDO firma del aprendiz');
      await this.insertarFirma(pdfDoc, firstPage, formData.firma_aprendiz, 150, 250);
    }

    if (formData.firma_tutor && formData.aprendiz.menor_edad) {
      console.log('✅ INSERTANDO firma del tutor');
      await this.insertarFirma(pdfDoc, firstPage, formData.firma_tutor, 150, 150);
    } else {
      console.log('❌ NO se inserta firma del tutor - Razón:', 
        !formData.firma_tutor ? 'No hay firma tutor' : 'No es menor de edad');
    }

    // 5. Insertar fecha actual
    this.insertarFecha(firstPage, font);

    return await pdfDoc.save();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}

  // MÉTODOS ORIGINALES DEL ACTA DE COMPROMISO - SIN MODIFICACIONES
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

    console.log('🔍 DEBUG - Datos del aprendiz:', aprendiz);
    console.log('🔍 DEBUG - otro_tipo:', aprendiz.otro_tipo);

    // NOMBRE COMPLETO - después de "Yo,"
    page.drawText(aprendiz.nombre, {
      x: 85,
      y: height - 85,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // MARCAR TIPO DE DOCUMENTO CON "X" - TUS COORDENADAS ORIGINALES
    const tipoDocConfig = {
      'TI': { x: 220, y: height - 108 },
      'CC': { x: 310, y: height - 108 },
      'CE': { x: 395, y: height - 108 },
      'Otro': { x: 220, y: height - 130 }
    };

    const config = tipoDocConfig[aprendiz.tipo_documento];

    if (config) {
      page.drawText('X', {
        x: config.x,
        y: config.y,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      // Si es "Otro", escribir el tipo específico en el campo "Cual"
      if (aprendiz.tipo_documento === 'Otro' && aprendiz.otro_tipo) {
        page.drawText(aprendiz.otro_tipo, {
          x: 300,
          y: height - 130,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
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
      y: height - 147,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // FICHA DE CARACTERIZACIÓN
    page.drawText(aprendiz.ficha_caracterizacion, {
      x: 150,
      y: height - 170,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // CENTRO DE FORMACIÓN
    page.drawText(aprendiz.centro_formacion, {
      x: 340,
      y: height - 168,
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

    // MANTENIENDO TU CÓDIGO ORIGINAL PARA EL TUTOR EN EL ACTA
    page.drawText(`${tutor.tipo_documento} - ${this.formatearNumeroDocumento(tutor.numero_documento)}`, {
      x: 400,
      y: height - 620,
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

  // MÉTODO NUEVO SOLO PARA EL FORMATO DE TRATAMIENTO DE DATOS
  private static insertarDatosTratamiento(
    pdfDoc: PDFDocument, 
    page: PDFPage, 
    formData: FormData, 
    font: PDFFont, 
    fontBold: PDFFont
  ) {
    const { height } = page.getSize();
    const { aprendiz, tutor } = formData;

    if (!tutor) return;

    // FECHA (actual) - formato DD/MM/AAAA
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString();
    const fechaTexto = `${dia}/${mes}/${anio}`;
    
    page.drawText(fechaTexto, {
      x: 100,
      y: height - 55,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // CIUDAD
    page.drawText('Popayán', {
      x: 320,
      y: height - 55,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // REGIONAL
    page.drawText('Cauca', {
      x: 100,
      y: height - 80,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // CENTRO DE FORMACIÓN
    page.drawText(aprendiz.centro_formacion, {
      x: 320,
      y: height - 80,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // PROGRAMA DE FORMACIÓN
    page.drawText(aprendiz.programa_formacion, {
      x: 180,
      y: height - 105,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // FICHA
    page.drawText(aprendiz.ficha_caracterizacion, {
      x: 450,
      y: height - 105,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // NOMBRE DEL TUTOR (después de "Yo")
    page.drawText(tutor.parentesco, {
      x: 75,
      y: height - 155,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // TIPO DOCUMENTO TUTOR (marcar con X en CC o CE)
    if (tutor.tipo_documento === 'CC' || tutor.tipo_documento === 'Cédula de Ciudadanía') {
      page.drawText('X', { 
        x: 340, 
        y: height - 155, 
        size: 12, 
        font: fontBold, 
        color: rgb(0, 0, 0) 
      });
    } else if (tutor.tipo_documento === 'CE' || tutor.tipo_documento === 'Cédula de Extranjería') {
      page.drawText('X', { 
        x: 440, 
        y: height - 155, 
        size: 12, 
        font: fontBold, 
        color: rgb(0, 0, 0) 
      });
    }

    // NÚMERO DOCUMENTO TUTOR
    page.drawText(this.formatearNumeroDocumento(tutor.numero_documento), {
      x: 300,
      y: height - 175,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // CIUDAD EXPEDICIÓN TUTOR
    page.drawText('Popayán', {
      x: 430,
      y: height - 175,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // NOMBRE DEL APRENDIZ (menor)
    page.drawText(aprendiz.nombre, {
      x: 360,
      y: height - 200,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // NÚMERO TARJETA DE IDENTIDAD DEL APRENDIZ
    page.drawText(this.formatearNumeroDocumento(aprendiz.numero_documento), {
      x: 360,
      y: height - 220,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // FIRMA DEL TUTOR (nombre para la línea de firma)
    page.drawText(tutor.parentesco, {
      x: 100,
      y: height - 350,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // TIPO Y NÚMERO DOCUMENTO TUTOR (tabla de firmas)
    page.drawText(`${tutor.tipo_documento} - ${this.formatearNumeroDocumento(tutor.numero_documento)}`, {
      x: 320,
      y: height - 370,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // EMAIL TUTOR
    page.drawText(tutor.email, {
      x: 150,
      y: height - 390,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // DIRECCIÓN TUTOR
    page.drawText(tutor.direccion, {
      x: 150,
      y: height - 410,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // INSERTAR FIRMAS
    if (formData.firma_tutor) {
      this.insertarFirma(pdfDoc, page, formData.firma_tutor, 100, height - 340);
    }

    if (formData.firma_aprendiz) {
      this.insertarFirma(pdfDoc, page, formData.firma_aprendiz, 100, height - 300);
    }
  }
}