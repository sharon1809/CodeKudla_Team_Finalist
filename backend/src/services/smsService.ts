import axios from 'axios';

export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.warn('FAST2SMS_API_KEY not found. Skipping SMS send.');
    // In dev environment, we just log the SMS
    console.log(`[SMS MOCK] To: ${phoneNumber} | Message: ${message}`);
    return true;
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'v3',
        sender_id: 'TXTIND', // Default testing sender ID
        message: message,
        language: 'english',
        flash: 0,
        numbers: phoneNumber,
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.return) {
      console.log(`SMS sent successfully to ${phoneNumber}`);
      return true;
    } else {
      console.error('Fast2SMS failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('Error sending SMS via Fast2SMS:', error?.response?.data || error.message);
    return false;
  }
};
