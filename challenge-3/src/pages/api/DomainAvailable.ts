import { NextApiRequest, NextApiResponse } from 'next';
import { isDomainAvailable } from '../../lib/resources';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const domain: any = req.query.domain;

    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required and should be a string.' });
    }

    try {
        const available: boolean = await isDomainAvailable(domain);
        return res.status(200).json({ available });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
