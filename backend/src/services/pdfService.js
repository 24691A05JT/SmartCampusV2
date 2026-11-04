import PDFDocument from 'pdfkit';

/**
 * Generate a high-resolution, vector-styled PDF certificate buffer
 * @param {Object} certificateData
 * @param {string} certificateData.certificateId
 * @param {string} certificateData.studentName
 * @param {string} [certificateData.department]
 * @param {number} [certificateData.year]
 * @param {string} certificateData.eventTitle
 * @param {string} certificateData.eventCategory
 * @param {string|Date} certificateData.eventDate
 * @param {string} [certificateData.venue]
 * @param {string|Date} certificateData.issueDate
 * @param {string} certificateData.verificationHash
 * @param {string} [certificateData.organizerName]
 * @param {string} [certificateData.status]
 * @returns {Promise<Buffer>}
 */
export const generateCertificatePDF = (certificateData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        certificateId = 'SC-CERT-UNKNOWN',
        studentName = 'Honored Student',
        department = 'General Studies',
        year = null,
        eventTitle = 'Campus Event',
        eventCategory = 'Activity',
        eventDate = new Date(),
        venue = 'Campus Center',
        issueDate = new Date(),
        verificationHash = '',
        organizerName = 'Faculty Convener',
        status = 'valid'
      } = certificateData;

      // A4 Landscape: 841.89 x 595.28 points
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
        info: {
          Title: `Certificate of Participation - ${studentName}`,
          Author: 'Smart Campus University',
          Subject: eventTitle,
          Keywords: 'certificate, participation, smartcampus, academic',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // 1. Decorative Outer & Inner Border Frames
      // Outer slate border
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
        .lineWidth(3.5)
        .strokeColor('#0f172a')
        .stroke();

      // Inner amber/gold border
      doc.rect(27, 27, pageWidth - 54, pageHeight - 54)
        .lineWidth(1.2)
        .strokeColor('#d97706')
        .stroke();

      // Decorative corner accents (Diamond squares in each corner)
      const drawCornerDiamond = (cx, cy) => {
        doc.save()
          .translate(cx, cy)
          .rotate(45)
          .rect(-5, -5, 10, 10)
          .fillColor('#d97706')
          .fill()
          .restore();
      };
      drawCornerDiamond(27, 27);
      drawCornerDiamond(pageWidth - 27, 27);
      drawCornerDiamond(27, pageHeight - 27);
      drawCornerDiamond(pageWidth - 27, pageHeight - 27);

      // Subtle background watermark tint
      doc.save();
      doc.rect(32, 32, pageWidth - 64, pageHeight - 64)
        .fillColor('#f8fafc')
        .fillOpacity(0.4)
        .fill();
      doc.restore();

      // 2. Header & Institutional Branding
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('SMART CAMPUS UNIVERSITY', 0, 52, { align: 'center', characterSpacing: 1.5 });

      doc.fontSize(8.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('OFFICE OF ACADEMIC AFFAIRS & STUDENT ENGAGEMENT', { align: 'center', characterSpacing: 2 });

      // Horizontal divider with gold diamond center
      doc.moveTo(180, 84).lineTo(pageWidth - 180, 84).lineWidth(0.75).strokeColor('#cbd5e1').stroke();
      doc.save()
        .translate(pageWidth / 2, 84)
        .rotate(45)
        .rect(-4, -4, 8, 8)
        .fillColor('#d97706')
        .fill()
        .restore();

      // 3. Certificate Title
      doc.moveDown(1.2);
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1e1b4b')
        .text('CERTIFICATE OF PARTICIPATION', { align: 'center', characterSpacing: 1 });

      doc.fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor('#4f46e5')
        .text('AND CO-CURRICULAR ACHIEVEMENT', { align: 'center', characterSpacing: 2 });

      // 4. Presentation Line
      doc.moveDown(0.9);
      doc.fontSize(11)
        .font('Helvetica-Oblique')
        .fillColor('#64748b')
        .text('This is proudly presented to', { align: 'center' });

      // 5. Student Name & Academic Affiliation
      doc.moveDown(0.6);
      doc.fontSize(23)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(studentName.toUpperCase(), { align: 'center', characterSpacing: 1.2 });

      // Student metadata line
      const deptText = year ? `${department} • Year ${year}` : department;
      doc.fontSize(9.5)
        .font('Helvetica')
        .fillColor('#475569')
        .text(deptText, { align: 'center' });

      // 6. Event Recognition Details
      doc.moveDown(0.9);
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#475569')
        .text('for distinguished attendance, active engagement, and successful completion of the campus event', { align: 'center' });

      doc.moveDown(0.4);
      doc.fontSize(15)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(`"${eventTitle}"`, { align: 'center' });

      // Format date
      const formattedEventDate = eventDate instanceof Date
        ? eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const metaInfo = `Category: ${eventCategory}   |   Venue: ${venue}   |   Conducted on: ${formattedEventDate}`;
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(metaInfo, { align: 'center' });

      // 7. Signature Blocks (Organizer & University Dean)
      const sigY = 440;

      // Left signature (Faculty Convener)
      doc.moveTo(110, sigY).lineTo(290, sigY).lineWidth(1).strokeColor('#94a3b8').stroke();
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(organizerName, 110, sigY + 6, { width: 180, align: 'center' });
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Faculty Event Convener', 110, sigY + 20, { width: 180, align: 'center' });

      // Center decorative seal
      doc.save();
      doc.circle(pageWidth / 2, sigY + 8, 22)
        .lineWidth(1.5)
        .strokeColor('#d97706')
        .stroke();
      doc.circle(pageWidth / 2, sigY + 8, 19)
        .lineWidth(0.5)
        .strokeColor('#d97706')
        .stroke();
      doc.fontSize(6)
        .font('Helvetica-Bold')
        .fillColor('#b45309')
        .text('OFFICIAL', (pageWidth / 2) - 20, sigY + 2, { width: 40, align: 'center' });
      doc.text('SEAL', (pageWidth / 2) - 20, sigY + 10, { width: 40, align: 'center' });
      doc.restore();

      // Right signature (Dean of Student Affairs)
      doc.moveTo(pageWidth - 290, sigY).lineTo(pageWidth - 110, sigY).lineWidth(1).strokeColor('#94a3b8').stroke();
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Dr. Rajesh Kumar', pageWidth - 290, sigY + 6, { width: 180, align: 'center' });
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Dean of Student Affairs', pageWidth - 290, sigY + 20, { width: 180, align: 'center' });

      // 8. Security & Cryptographic Verification Footer Box
      const footerY = 505;
      const footerBoxWidth = pageWidth - 100;
      doc.rect(50, footerY, footerBoxWidth, 48)
        .fillColor('#f1f5f9')
        .fill();
      doc.rect(50, footerY, footerBoxWidth, 48)
        .lineWidth(0.8)
        .strokeColor('#cbd5e1')
        .stroke();

      const formattedIssueDate = issueDate instanceof Date
        ? issueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date(issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Footer Row 1: Certificate ID, Issue Date, Verification Link
      doc.fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`Certificate ID: ${certificateId}`, 62, footerY + 8);

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Issued: ${formattedIssueDate}`, 300, footerY + 8, { width: 150, align: 'center' });

      const clientUrl = process.env.CLIENT_URL || 'https://campus.domain';
      const verifyUrl = `${clientUrl}/verify/${certificateId}`;
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#4f46e5')
        .text(`Verify Online: ${verifyUrl}`, pageWidth - 360, footerY + 8, { width: 300, align: 'right' });

      // Footer Row 2: SHA-256 Cryptographic Hash
      const truncatedHash = verificationHash.length > 56
        ? `${verificationHash.substring(0, 56)}...`
        : verificationHash || 'Authentic Signature';
      doc.fontSize(7)
        .font('Courier')
        .fillColor('#64748b')
        .text(`Cryptographic SHA-256 Hash: ${truncatedHash}`, 62, footerY + 28);

      // 9. Watermark Overlay if Status is Revoked
      if (status === 'revoked') {
        doc.save();
        doc.translate(pageWidth / 2, pageHeight / 2)
          .rotate(-30)
          .fontSize(60)
          .font('Helvetica-Bold')
          .fillColor('#ef4444')
          .fillOpacity(0.35)
          .text('REVOKED - VOID', -250, -25, { width: 500, align: 'center' });
        doc.restore();
      }

      // Finalize the PDF document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
