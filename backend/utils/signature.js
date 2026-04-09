const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Add digital signature text to a PDF document
 */
const signPDF = async (inputPath, outputPath, signerName, signatureText) => {
  try {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const signatureBoxX = width - 280;
    const signatureBoxY = 30;
    const boxWidth = 250;
    const boxHeight = 110;

    // Draw signature box background
    lastPage.drawRectangle({
      x: signatureBoxX - 5,
      y: signatureBoxY - 5,
      width: boxWidth + 10,
      height: boxHeight + 10,
      color: rgb(0.95, 0.97, 1),
      borderColor: rgb(0.4, 0.4, 0.8),
      borderWidth: 1.5,
    });

    // Header bar
    lastPage.drawRectangle({
      x: signatureBoxX - 5,
      y: signatureBoxY + boxHeight - 5,
      width: boxWidth + 10,
      height: 22,
      color: rgb(0.4, 0.4, 0.8),
    });

    lastPage.drawText('DIGITALLY SIGNED', {
      x: signatureBoxX + 30,
      y: signatureBoxY + boxHeight,
      size: 9,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Signature content
    lastPage.drawText('Verified By:', {
      x: signatureBoxX,
      y: signatureBoxY + 80,
      size: 8,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.5),
    });

    lastPage.drawText(signerName, {
      x: signatureBoxX,
      y: signatureBoxY + 65,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.6),
    });

    lastPage.drawText(signatureText || 'Academic Administration', {
      x: signatureBoxX,
      y: signatureBoxY + 50,
      size: 8,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const signedDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    lastPage.drawText(`Date: ${signedDate}`, {
      x: signatureBoxX,
      y: signatureBoxY + 35,
      size: 8,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    lastPage.drawText('This document is digitally verified.', {
      x: signatureBoxX,
      y: signatureBoxY + 18,
      size: 7,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    lastPage.drawText('ADSMS - Academic Digital Signature System', {
      x: signatureBoxX,
      y: signatureBoxY + 5,
      size: 6.5,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.8),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    return true;
  } catch (error) {
    console.error('PDF signing error:', error.message);
    return false;
  }
};

module.exports = { signPDF };
