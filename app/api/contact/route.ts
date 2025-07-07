import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Helper function to format dates
const formatDate = (date: string | null): string => {
  if (!date) return "Non renseignée";
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "Non renseignée";
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(parsedDate).toLowerCase();
};

export async function POST(req: Request) {
  const data = await req.json();
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="background-color: #f4f4f4; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #333;">Nouveau message de contact</h2>
      <div style="padding: 20px;">
        <p><strong>Nom:</strong> ${data.lastname}</p>
        <p><strong>Prénom:</strong> ${data.firstname}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Téléphone:</strong> ${data.phone || 'non renseigné'}</p>
        <p><strong>Date de début:</strong> ${formatDate(data.dateRange?.from)}</p>
        <p><strong>Date de fin:</strong> ${formatDate(data.dateRange?.to)}</p>
        <p><strong>Message:</strong> ${data.message || 'aucun message'}</p>
      </div>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      subject: 'Nouveau contact depuis le site',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}