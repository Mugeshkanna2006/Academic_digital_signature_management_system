const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendApprovalEmail = async (studentEmail, studentName, documentTitle, downloadLink) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ADSMS System" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: '✅ Document Approved & Signed - ADSMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📜 Document Approved!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Academic Digital Signature System</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #374151;">Dear <strong>${studentName}</strong>,</p>
            <p style="color: #6b7280;">Your document has been reviewed and digitally signed by the administrator.</p>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;"><strong>Document:</strong> ${documentTitle}</p>
              <p style="margin: 8px 0 0; color: #16a34a;"><strong>Status:</strong> ✅ Approved & Signed</p>
            </div>
            <p style="color: #6b7280;">You can now download your signed document from your dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${downloadLink || '#'}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Download Signed Document
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated notification from ADSMS. Please do not reply.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const sendRejectionEmail = async (studentEmail, studentName, documentTitle, remarks) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ADSMS System" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: '❌ Document Rejected - ADSMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📄 Document Rejected</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Academic Digital Signature System</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #374151;">Dear <strong>${studentName}</strong>,</p>
            <p style="color: #6b7280;">Unfortunately, your document could not be approved at this time.</p>
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>Document:</strong> ${documentTitle}</p>
              <p style="margin: 8px 0 0; color: #dc2626;"><strong>Status:</strong> ❌ Rejected</p>
              ${remarks ? `<p style="margin: 8px 0 0; color: #7f1d1d;"><strong>Reason:</strong> ${remarks}</p>` : ''}
            </div>
            <p style="color: #6b7280;">Please review the feedback above, make necessary corrections, and re-upload your document.</p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated notification from ADSMS. Please do not reply.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

module.exports = { sendApprovalEmail, sendRejectionEmail };
