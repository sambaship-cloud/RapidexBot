// lib/saveLeadToSheet.js
import { google } from 'googleapis';

export async function saveLeadToSheet({ phone, name, email, address, cpf }) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1LtTLepKu1NhMK6qebaooS4P6t4EXsyeSetmDttn2CoY'; // 👈 Replace this with your actual sheet ID
  const range = 'Sheet1!A2:F'; // Adjust range/sheet name if needed

  const row = [
    new Date().toISOString(),
    phone,
    name,
    email,
    address,
    cpf,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}
