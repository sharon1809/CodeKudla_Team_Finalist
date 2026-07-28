import { Request, Response } from 'express';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'A user with this email already exists' });
      return;
    }

    const user = new User({ email, password, firstName, lastName });
    await user.save();

    const payload = { id: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    const tokenRecord = new RefreshToken({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });
    await tokenRecord.save();

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const payload = { id: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await new RefreshToken({
      token: refreshToken,
      user: user._id,
      expiresAt,
    }).save();

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: tokenInput } = req.body;

    if (!tokenInput) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify token exists in database
    const savedToken = await RefreshToken.findOne({ token: tokenInput });
    if (!savedToken) {
      res.status(403).json({ message: 'Refresh token is invalid or expired' });
      return;
    }

    // Check expiration
    if (new Date() > savedToken.expiresAt) {
      await RefreshToken.deleteOne({ _id: savedToken._id });
      res.status(403).json({ message: 'Refresh token has expired' });
      return;
    }

    try {
      const decoded = verifyRefreshToken(tokenInput);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Generate new tokens
      const payload = { id: user._id.toString(), email: user.email };
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Rotate token: Delete old token and save new token
      await RefreshToken.deleteOne({ _id: savedToken._id });
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await new RefreshToken({
        token: newRefreshToken,
        user: user._id,
        expiresAt,
      }).save();

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err: any) {
      // Token JWT verification failed
      await RefreshToken.deleteOne({ _id: savedToken._id });
      res.status(403).json({ message: 'Refresh token verification failed', error: err.message });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: tokenInput } = req.body;

    if (tokenInput) {
      await RefreshToken.deleteOne({ token: tokenInput });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { firstName, lastName, password } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};
