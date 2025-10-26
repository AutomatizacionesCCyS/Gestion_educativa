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
  nombre: string; // ✅ NUEVO
  tipo_documento: string;
  numero_documento: string;
  lugar_expedicion: string; // ✅ NUEVO
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

// 🔍 MÉTODO PARA DESCUBRIR CAMPOS - AGREGA ESTO JUSTO AQUÍ
  static async discoverFormFields(): Promise<void> {
    try {
      const templatePath = path.join(process.cwd(), 'public', 'form-tratamiento-datos.pdf');
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      
      const fields = form.getFields();
      console.log('=== CAMPOS DE FORMULARIO ENCONTRADOS ===');
      fields.forEach(field => {
        console.log(`Nombre: "${field.getName()}", Tipo: ${field.constructor.name}`);
      });
    } catch (error) {
      console.error('Error descubriendo campos:', error);
    }
  }

  // ↓↓↓ ESTOS SON TUS MÉTODOS EXISTENTES ↓↓↓
  static async createPdf(formData: FormData): Promise<Uint8Array> {
    try {
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

  // 📋 MÉTODO ACTUALIZADO PARA TRATAMIENTO DE DATOS
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
    const form = pdfDoc.getForm();

    const { aprendiz, tutor } = formData;

    // Datos simulados para campos fijos
    const datosSimulados = {
      ciudad: "Popayán",
      regional: "Cauca"
    };

    try {
      // Llenar campos del formulario
      this.llenarCampo(form, 'fecha', this.obtenerFechaActual());
      this.llenarCampo(form, 'ciudad', datosSimulados.ciudad);
      this.llenarCampo(form, 'regional', datosSimulados.regional);
      this.llenarCampo(form, 'centro_formacion', aprendiz.centro_formacion);
      this.llenarCampo(form, 'no_ficha', aprendiz.ficha_caracterizacion);
      
      // Campos del tutor
      this.llenarCampo(form, 'nombre_tutor', tutor.nombre);
      this.llenarCampo(form, 'num_documento', this.formatearNumeroDocumento(tutor.numero_documento));
      this.llenarCampo(form, 'municipio_documento', tutor.lugar_expedicion);
      this.llenarCampo(form, 'tipo_y_documento_tutor', `${tutor.tipo_documento} - ${this.formatearNumeroDocumento(tutor.numero_documento)}`);
      
      // Campos del aprendiz (menor)
      this.llenarCampo(form, 'nombre_aprendiz#0', aprendiz.nombre);
      this.llenarCampo(form, 'nombre_aprendiz#1', aprendiz.nombre);
      this.llenarCampo(form, 'num_tarjeta#0', this.formatearNumeroDocumento(aprendiz.numero_documento));
      this.llenarCampo(form, 'num_tarjeta#1', this.formatearNumeroDocumento(aprendiz.numero_documento));
      
      // Campos de contacto
      this.llenarCampo(form, 'correo_e', tutor.email);
      this.llenarCampo(form, 'direccion_contacto', tutor.direccion);

      // Marcar tipo de documento del tutor (CC o CE)
      this.marcarTipoDocumentoTutor(form, tutor.tipo_documento);

      console.log('✅ Formulario de tratamiento de datos llenado exitosamente');

    } catch (error) {
      console.error('Error llenando formulario:', error);
    }

    return await pdfDoc.save();
  }

  // 🛠️ MÉTODOS AUXILIARES
  private static llenarCampo(form: any, fieldName: string, value: string) {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
      console.log(`✅ Campo ${fieldName} llenado: ${value}`);
    } catch (error) {
      console.warn(`⚠️ Campo ${fieldName} no encontrado`);
    }
  }

  private static marcarTipoDocumentoTutor(form: any, tipoDocumento: string) {
    try {
      if (tipoDocumento === 'CC' || tipoDocumento.includes('Cédula de Ciudadanía')) {
        const campoCC = form.getTextField('cc');
        campoCC.setText('X');
        console.log('✅ Campo CC marcado con X');
      } else if (tipoDocumento === 'CE' || tipoDocumento.includes('Cédula de Extranjería')) {
        const campoCE = form.getTextField('ce');
        campoCE.setText('X');
        console.log('✅ Campo CE marcado con X');
      }
    } catch (error) {
      console.warn('⚠️ Campos CC/CE no encontrados');
    }
  }

  private static obtenerFechaActual(): string {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString();
    return `${dia}/${mes}/${anio}`;
  }

  // 📄 MÉTODOS EXISTENTES DEL ACTA (MANTENER SIN CAMBIOS)
  static async createActaCompromiso(formData: FormData): Promise<Uint8Array> {
    try {
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

      console.log('🔍 DEBUG Acta - Datos aprendiz:', formData.aprendiz);
      console.log('🔍 DEBUG Acta - Es menor de edad?:', formData.aprendiz.menor_edad);
      console.log('🔍 DEBUG Acta - Datos tutor:', formData.tutor);

      // Insertar datos del aprendiz
      this.insertarDatosAprendiz(firstPage, formData.aprendiz, font, fontBold);

      // Insertar datos del tutor si es menor
      if (formData.tutor && formData.aprendiz.menor_edad) {
        console.log('✅ INSERTANDO datos del tutor en Acta');
        this.insertarDatosTutor(firstPage, formData.tutor, font, fontBold);
      }

      // Insertar firmas
      if (formData.firma_aprendiz) {
        await this.insertarFirma(pdfDoc, firstPage, formData.firma_aprendiz, 150, 250);
      }

      if (formData.firma_tutor && formData.aprendiz.menor_edad) {
        await this.insertarFirma(pdfDoc, firstPage, formData.firma_tutor, 150, 150);
      }

      // Insertar fecha actual
      this.insertarFecha(firstPage, font);

      return await pdfDoc.save();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  private static async insertarFirma(pdfDoc: PDFDocument, page: PDFPage, firmaBase64: string, x: number, y: number) {
    try {
      const base64Data = firmaBase64.split(',')[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      let image;
      if (firmaBase64.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

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

    // NOMBRE COMPLETO
    page.drawText(aprendiz.nombre, {
      x: 85,
      y: height - 85,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // MARCAR TIPO DE DOCUMENTO
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

    // NÚMERO DE DOCUMENTO
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

    // NÚMERO DE DOCUMENTO EN FIRMAS
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
}