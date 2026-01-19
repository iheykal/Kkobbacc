import { Resend } from 'resend';

// Initialize lazily to prevent top-level crashes
let resend: Resend | null = null;

export async function sendOTPEmail(email: string, otp: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing');
      return { success: false, error: 'Server configuration error: Missing email API key' };
    }

    if (!resend) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }

    // --- CUSTOMIZE EMAIL TEXT HERE ---
    const emailText = {
      subject: 'Your Login Code - Kobac Property', // Subject Line
      headerTitle: '🔐 Your Login Code',
      welcome: 'Welcome to Kobac Property!',
      intro: 'Your one-time password (OTP) to sign in is:',
      warning: '⏱️ This code will expire in 10 minutes.', // Expiration warning
      instruction: 'Enter this code on the login page to complete your sign in.',
      security: 'If you didn\'t request this code, you can safely ignore this email. Your account remains secure.',
      footerTagline: 'Your trusted partner in finding the perfect property'
    };

    // Somali Translation (Uncomment to use)
    /*
    const emailText = {
      subject: 'Koodka Gelitaanka - Kobac Property',
      headerTitle: '🔐 Koodkaaga Gelitaanka',
      welcome: 'Kusoo dhawow Kobac Property!',
      intro: 'Koodkaaga (OTP) aad ku galeyso waa:',
      warning: '⏱️ Koodkan wuxuu dhacayaa 10 daqiiqo gudahood.',
      instruction: 'Geli koodkan bogga gelitaanka si aad u dhameystirto.',
      security: 'Haddii aadan dalban koodkan, waad iska indhatiri kartaa. Akoonkaagu wuu ammaan yahay.',
      footerTagline: 'Wehelkaaga aaminka ah ee helitaanka guriga ugu fiican'
    };
    */

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: emailText.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content { 
                padding: 40px 30px;
                background: #ffffff;
              }
              .content h2 {
                color: #1a1a1a;
                font-size: 20px;
                margin: 0 0 20px 0;
              }
              .content p {
                color: #666;
                font-size: 16px;
                margin: 0 0 20px 0;
              }
              .otp-box { 
                background: #f8f9fa;
                border: 2px dashed #667eea; 
                padding: 30px 20px; 
                text-align: center; 
                font-size: 36px; 
                font-weight: bold; 
                letter-spacing: 10px; 
                margin: 30px 0; 
                border-radius: 10px;
                color: #667eea;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning p {
                margin: 0;
                color: #856404;
                font-size: 14px;
              }
              .footer { 
                text-align: center; 
                padding: 30px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
              }
              .footer p {
                margin: 5px 0;
                font-size: 13px; 
                color: #6c757d;
              }
              .footer a {
                color: #667eea;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${emailText.headerTitle}</h1>
              </div>
              <div class="content">
                <h2>${emailText.welcome}</h2>
                <p>${emailText.intro}</p>
                <div class="otp-box">${otp}</div>
                <div class="warning">
                  <p><strong>${emailText.warning}</strong></p>
                </div>
                <p>${emailText.instruction}</p>
                <p>${emailText.security}</p>
              </div>
              <div class="footer">
                <p><strong>Kobac Property</strong></p>
                <p>${emailText.footerTagline}</p>
                <p style="margin-top: 15px;">© ${new Date().getFullYear()} Kobac Property. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Email send failed:', error);
      return { success: false, error };
    }

    console.log('✅ OTP email sent successfully:', { email, messageId: data?.id });
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error };
  }
}
