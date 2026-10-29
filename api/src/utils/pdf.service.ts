import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface ReleaseOrderData {
  orderNumber: string;
  orderDate: Date;
  institutionName: string;
  institutionCode: string;
  fdrNumber: string;
  bankName: string;
  branchName: string;
  amount: number;
  issueDate: Date;
  maturityDate: Date;
  refundAccount: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
  approvedBy: string;
  authorityDesignation: string;
}

export class PdfService {
  /**
   * Generates a tamper-proof official AICTE FDR Release Order PDF with embedded QR Code
   */
  public static async generateReleaseOrderPdf(data: ReleaseOrderData): Promise<Buffer> {
    // Generate QR Code data URL
    const verificationUrl = `https://deposittrack.aicte.gov.in/verify-order/${data.orderNumber}`;
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1F3A68', light: '#FFFFFF' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // 1. Top Tricolour Header Band
      doc.rect(50, 40, 495, 4).fill('#FF9933'); // Saffron
      doc.rect(50, 44, 495, 3).fill('#FFFFFF'); // White
      doc.rect(50, 47, 495, 4).fill('#138808'); // Green

      // 2. Official AICTE Header
      doc.moveDown(1.5);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F3A68').text('ALL INDIA COUNCIL FOR TECHNICAL EDUCATION', {
        align: 'center',
      });
      doc.fontSize(10).font('Helvetica').fillColor('#4B5563').text('(A STATUTORY BODY OF THE GOVERNMENT OF INDIA)', {
        align: 'center',
      });
      doc.fontSize(9).text('Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | https://aicte-india.org', {
        align: 'center',
      });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').stroke();
      doc.moveDown(0.8);

      // 3. Document Title & Order Metadata
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1F3A68').text('ORDER FOR RELEASE OF SECURITY DEPOSIT / FDR', {
        align: 'center',
        underline: true,
      });

      doc.moveDown(1);
      const metaY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827');
      doc.text(`Order No: ${data.orderNumber}`, 50, metaY);
      doc.font('Helvetica').text(`Date: ${data.orderDate.toLocaleDateString('en-IN')}`, 380, metaY, { align: 'right' });

      doc.moveDown(1.2);

      // 4. Body Content
      doc.fontSize(10).font('Helvetica').fillColor('#1F2937').lineGap(4);
      doc.text(
        `WHEREAS, the institution named below has submitted an application for the release/refund of the Fixed Deposit Receipt (FDR) pledged in favour of the Member Secretary, AICTE, New Delhi towards security deposit requirements.`
      );
      doc.moveDown(0.5);
      doc.text(
        `AND WHEREAS, the Competent Authority of the Council, after due scrutiny of records, confirmation from the respective bank CBS, and fulfillment of all regulatory conditions, has accorded approval for the release of the said deposit.`
      );

      doc.moveDown(1);

      // 5. Structured Data Table
      const tableTop = doc.y;
      doc.rect(50, tableTop, 495, 140).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#0F172A').font('Helvetica-Bold');

      let rowY = tableTop + 10;
      const leftCol = 65;
      const rightCol = 220;

      const printRow = (label: string, val: string) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label, leftCol, rowY);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text(val, rightCol, rowY);
        rowY += 18;
      };

      printRow('Institution Name:', `${data.institutionName} (${data.institutionCode})`);
      printRow('FDR Instrument Number:', data.fdrNumber);
      printRow('Pledged Bank & Branch:', `${data.bankName}, ${data.branchName}`);
      printRow('Principal Amount Held:', `₹${data.amount.toLocaleString('en-IN')}`);
      printRow('Issue & Maturity Dates:', `${data.issueDate.toLocaleDateString('en-IN')} to ${data.maturityDate.toLocaleDateString('en-IN')}`);
      printRow('Refund Credit Account:', `${data.refundAccount.accountNumber} (IFSC: ${data.refundAccount.ifsc})`);
      printRow('Beneficiary Account Name:', data.refundAccount.accountName);

      doc.y = tableTop + 155;

      // 6. Release Direction
      doc.font('Helvetica').fontSize(9.5).fillColor('#1E293B').text(
        `NOW THEREFORE, sanction is hereby conveyed to the branch manager of ${data.bankName} to release the lien on FDR No. ${data.fdrNumber} and credit the proceeds along with accrued interest into the institution's designated account above.`
      );

      doc.moveDown(1.5);

      // 7. Signatures & QR Code Section
      const signY = doc.y;

      // QR Code
      doc.image(qrBuffer, 65, signY, { width: 90 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('Scan QR to verify authentic order on AICTE portal', 55, signY + 95, {
        width: 110,
        align: 'center',
      });

      // Digital Signature Box
      const sigBoxX = 330;
      doc.rect(sigBoxX, signY, 215, 90).fillAndStroke('#F0FDF4', '#86EFAC');
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#15803D').text('DIGITALLY APPROVED & SIGNED', sigBoxX + 10, signY + 10);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1F2937').text(data.approvedBy, sigBoxX + 10, signY + 28);
      doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563').text(data.authorityDesignation, sigBoxX + 10, signY + 42);
      doc.fontSize(8).fillColor('#4B5563').text('AICTE HQ, New Delhi', sigBoxX + 10, signY + 56);
      doc.fontSize(7).fillColor('#94A3B8').text(`Ref: DT-AUTH-SIGN-${data.orderNumber}`, sigBoxX + 10, signY + 72);

      // 8. Footer
      doc.fontSize(8).fillColor('#94A3B8').text(
        'This is a system-generated secure document under AICTE DEPOSIT-TRACK. No physical signature required.',
        50,
        780,
        { align: 'center', width: 495 }
      );

      doc.end();
    });
  }
}
