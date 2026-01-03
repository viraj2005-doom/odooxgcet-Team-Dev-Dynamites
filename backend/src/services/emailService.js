const nodemailer = require('nodemailer');

// Track email sending status
let emailServiceStatus = {
  configured: false,
  lastError: null,
  etherealAccount: null
};

// Cache for Ethereal transporter
let etherealTransporter = null;

// Create or get Ethereal transporter (for testing)
const getEtherealTransporter = async () => {
  if (etherealTransporter) {
    return etherealTransporter;
  }
  
  try {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();
    emailServiceStatus.etherealAccount = testAccount;
    
    console.log('📧 Ethereal Email Test Account Created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log(`   View emails at: https://ethereal.email/login`);
    
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    return etherealTransporter;
  } catch (error) {
    console.error('Failed to create Ethereal account:', error);
    return null;
  }
};

// Create transporter with proper Gmail configuration
const createTransporter = () => {
  // Check if email is configured
  const emailUser = process.env.SMTP_USER;
  const emailPass = process.env.SMTP_PASS;

  if (!emailUser || !emailPass || emailUser === 'your_actual_email@gmail.com' || emailPass === 'your_16_character_app_password') {
    emailServiceStatus.configured = false;
    return null; // Will use Ethereal instead
  }

  emailServiceStatus.configured = true;
  
  return nodemailer.createTransport({
    service: 'gmail', // Use Gmail service for easier setup
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// Get working transporter (Gmail or Ethereal)
const getTransporter = async () => {
  const gmailTransporter = createTransporter();
  if (gmailTransporter) {
    return { transporter: gmailTransporter, isEthereal: false };
  }
  
  // Fall back to Ethereal for testing
  const ethereal = await getEtherealTransporter();
  return { transporter: ethereal, isEthereal: true };
};

// Helper to check if email service is available
const isEmailConfigured = () => {
  const emailUser = process.env.SMTP_USER;
  const emailPass = process.env.SMTP_PASS;
  return emailUser && emailPass && 
         emailUser !== 'your_actual_email@gmail.com' && 
         emailPass !== 'your_16_character_app_password';
};

// Send welcome email with credentials
const sendWelcomeEmail = async (user, tempPassword) => {
  const { transporter, isEthereal } = await getTransporter();
  
  if (!transporter) {
    console.log(`📧 [SIMULATED] Welcome email to ${user.email}`);
    console.log(`   Login ID: ${user.loginId}`);
    console.log(`   Temp Password: ${tempPassword}`);
    return { simulated: true };
  }
  
  const fromEmail = isEthereal ? emailServiceStatus.etherealAccount?.user : process.env.SMTP_USER;
  
  const mailOptions = {
    from: `"Dayflow HRMS" <${fromEmail}>`,
    to: user.email,
    subject: 'Welcome to Dayflow - Your Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Dayflow!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Every workday, perfectly aligned.</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${user.firstName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account has been created. Please use the following credentials to log in:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login ID:</strong> ${user.loginId}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          
          <p style="color: #e74c3c; font-weight: bold;">
            ⚠️ You will be required to change your password on first login.
          </p>
          
          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background: #667eea; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Dayflow
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS. Please do not reply.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('✅ Welcome email sent to:', user.email);
};

// Send employee welcome email with verification link
const sendEmployeeWelcomeWithVerification = async (user, tempPassword, verificationToken) => {
  const { transporter, isEthereal } = await getTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  if (!transporter) {
    console.log(`📧 [SIMULATED] Employee welcome + verification email to ${user.email}`);
    console.log(`   Login ID: ${user.loginId}`);
    console.log(`   Temp Password: ${tempPassword}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    return { simulated: true, verificationUrl };
  }
  
  const fromEmail = isEthereal ? emailServiceStatus.etherealAccount?.user : process.env.SMTP_USER;
  
  const mailOptions = {
    from: `"Dayflow HRMS" <${fromEmail}>`,
    to: user.email,
    subject: 'Welcome to Dayflow - Verify Your Email & Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Dayflow!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Every workday, perfectly aligned.</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${user.firstName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account has been created. Before you can log in, please verify your email address.
          </p>
          
          <!-- Verify Email Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" 
               style="background: #27ae60; color: white; padding: 14px 40px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              ✓ Verify Email
            </a>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Login ID:</strong> ${user.loginId}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          
          <p style="color: #e74c3c; font-weight: bold;">
            ⚠️ You will be required to change your password on first login.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS. Please do not reply.</p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  // For Ethereal, log the URL to view the email
  if (isEthereal && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('✅ Employee welcome + verification email sent to:', user.email);
    console.log('📧 Preview URL (Ethereal):', previewUrl);
    return { emailSent: true, previewUrl };
  }
  
  console.log('✅ Employee welcome + verification email sent to:', user.email);
  return { emailSent: true };
};

// Send time off status email
const sendTimeOffStatusEmail = async (user, timeOff, status) => {
  const { transporter, isEthereal } = await getTransporter();
  
  if (!transporter) {
    console.log(`📧 [SIMULATED] Time-off ${status} email to ${user.email}`);
    return { simulated: true };
  }
  
  const statusColor = status === 'approved' ? '#27ae60' : '#e74c3c';
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';
  const fromEmail = isEthereal ? emailServiceStatus.etherealAccount?.user : process.env.SMTP_USER;
  
  const mailOptions = {
    from: `"Dayflow HRMS" <${fromEmail}>`,
    to: user.email,
    subject: `Time Off Request ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dayflow HRMS</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${user.firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your time off request has been reviewed.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${timeOff.type.replace('_', ' ')}</p>
            <p style="margin: 5px 0;"><strong>Period:</strong> ${new Date(timeOff.startDate).toLocaleDateString()} - ${new Date(timeOff.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Days:</strong> ${timeOff.totalDays}</p>
            <p style="margin: 10px 0 0 0;">
              <strong>Status:</strong> 
              <span style="color: ${statusColor}; font-weight: bold;">${statusText.toUpperCase()}</span>
            </p>
            ${timeOff.reviewNotes ? `<p style="margin: 10px 0 0 0;"><strong>Notes:</strong> ${timeOff.reviewNotes}</p>` : ''}
          </div>
          
          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/timeoff" 
               style="background: #667eea; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS. Please do not reply.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send attendance reminder
const sendAttendanceReminder = async (user) => {
  const { transporter, isEthereal } = await getTransporter();
  
  if (!transporter) {
    console.log(`📧 [SIMULATED] Attendance reminder to ${user.email}`);
    return { simulated: true };
  }
  
  const fromEmail = isEthereal ? emailServiceStatus.etherealAccount?.user : process.env.SMTP_USER;
  
  const mailOptions = {
    from: `"Dayflow HRMS" <${fromEmail}>`,
    to: user.email,
    subject: 'Reminder: Please Check In',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dayflow HRMS</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${user.firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            This is a friendly reminder to check in for today.
          </p>
          
          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/attendance" 
               style="background: #27ae60; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Check In Now
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send email verification
const sendEmailVerification = async (user, token) => {
  const { transporter, isEthereal } = await getTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  if (!transporter) {
    console.log(`📧 [SIMULATED] Email verification to ${user.email}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    return { simulated: true, verificationUrl };
  }
  
  const fromEmail = isEthereal ? emailServiceStatus.etherealAccount?.user : process.env.SMTP_USER;
  
  const mailOptions = {
    from: `"Dayflow HRMS" <${fromEmail}>`,
    to: user.email,
    subject: 'Verify Your Email - Dayflow HRMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dayflow HRMS</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Every workday, perfectly aligned.</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Verify Your Email</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with Dayflow HRMS. Please verify your email address by clicking the button below.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" 
               style="background: #667eea; color: white; padding: 14px 40px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS. Please do not reply.</p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  // For Ethereal, log the URL to view the email
  if (isEthereal && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('✅ Verification email sent to:', user.email);
    console.log('📧 Preview URL (Ethereal):', previewUrl);
    return { emailSent: true, previewUrl };
  }
  
  console.log('✅ Verification email sent to:', user.email);
  return { emailSent: true };
};

module.exports = {
  sendWelcomeEmail,
  sendEmployeeWelcomeWithVerification,
  sendTimeOffStatusEmail,
  sendAttendanceReminder,
  sendEmailVerification,
  isEmailConfigured
};
