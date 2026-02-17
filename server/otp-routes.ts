import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

const otpRouter = Router();

const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

otpRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.log(`Password comparison error:`, error);
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    cleanupExpiredOTPs();

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    console.log(`\n========================================`);
    console.log(`  OTP for ${email}: ${otp}`);
    console.log(`  (Valid for 5 minutes)`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

otpRouter.post('/verify-login', async (req: Request, res: Response) => {
  try {
    const { email, password, otp } = req.body;
    if (!email || !password || !otp) {
      return res.status(400).json({ message: 'Email, password, and OTP are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.log(`Password comparison error:`, error);
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const storedOtp = otpStore.get(email);
    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP expired or not requested. Please request a new one.' });
    }

    if (storedOtp.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    storedOtp.attempts += 1;
    if (storedOtp.attempts > 5) {
      otpStore.delete(email);
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(email);

    (req.session as any).userId = user.id;
    (req.session as any).userRole = user.role;

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default otpRouter;
