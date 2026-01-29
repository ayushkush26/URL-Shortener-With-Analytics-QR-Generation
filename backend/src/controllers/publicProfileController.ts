import { Request, Response } from 'express';
import { User } from '../models/User';
import { ShortUrl } from '../models/ShortUrl';
import QRCode from 'qrcode';

/**
 * Get public profile by username
 * GET /api/public/u/:username
 */
export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        // Find user by username
        const user = await User.findOne({ username: username.toLowerCase() }).select(
            'username email profile createdAt linkhubLinks'
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if profile is public
        if (user.profile?.isPublic === false) {
            return res.status(403).json({ error: 'This profile is private' });
        }

        // Get user's linkhub links (sorted by position)
        const linkhubLinks = (user.linkhubLinks || [])
            .filter(link => link.visible !== false)
            .sort((a, b) => a.position - b.position)
            .map(link => ({
                title: link.title,
                url: link.url,
                icon: link.icon,
            }));

        // Return public profile data
        res.json({
            username: user.username,
            profile: {
                firstName: user.profile?.firstName,
                lastName: user.profile?.lastName,
                avatar: user.profile?.avatar,
                bio: user.profile?.bio,
                jobTitle: user.profile?.jobTitle,
                company: user.profile?.company,
                location: user.profile?.location,
            },
            links: linkhubLinks,
            totalLinks: linkhubLinks.length,
            memberSince: user.createdAt,
        });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ error: 'Failed to fetch public profile' });
    }
};

/**
 * Get QR code for user's public profile
 * GET /api/public/u/:username/qr
 */
export const getProfileQRCode = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        // Verify user exists and profile is public
        const user = await User.findOne({ username: username.toLowerCase() }).select('profile');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.profile?.isPublic === false) {
            return res.status(403).json({ error: 'This profile is private' });
        }

        // Generate profile URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const profileUrl = `${frontendUrl}/u/${username}`;

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 512,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        res.json({
            qrCode: qrCodeDataUrl,
            profileUrl,
        });
    } catch (error) {
        console.error('Error generating profile QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
};
