const { google } = require('googleapis');
const emailjs = require('@emailjs/nodejs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerEmail, sessionTime } = req.body;

  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const startTime = new Date(sessionTime);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const event = await calendar.events.insert({
      calendarId: 'fluencyandrew@gmail.com',
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Discovery Call — ${customerName}`,
        description: `English Fluency Discovery Call with Andrew Pritchard`,
        start: { dateTime: startTime.toISOString(), timeZone: 'Europe/London' },
        end: { dateTime: endTime.toISOString(), timeZone: 'Europe/London' },
        attendees: [
          { email: 'fluencyandrew@gmail.com' },
          { email: customerEmail }
        ],
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'email', minutes: 15 }]
        }
      }
    });

    const meetLink = event.data.conferenceData?.entryPoints?.[0]?.uri || 'Link will be provided shortly';
    const eventLink = event.data.htmlLink;

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_name: customerName,
        to_email: customerEmail,
        session_time: new Date(sessionTime).toLocaleString('en-GB', {
          weekday: 'long', year: 'numeric', month: 'long',
          day: 'numeric', hour: '2-digit', minute: '2-digit',
          timeZone: 'Europe/London'
        }),
        meet_link: meetLink,
        calendar_link: eventLink
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY
      }
    );

    return res.status(200).json({ meetLink, eventLink });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};