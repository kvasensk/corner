import type { NextApiRequest, NextApiResponse } from 'next';
import { updateDonationStatus } from '../../src/lib/firebase';

interface YookassaWebhook {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: {
      value: string;
      currency: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData: YookassaWebhook = req.body;

    // Проверяем тип события
    if (
      webhookData.type !== 'notification' ||
      webhookData.event !== 'payment.succeeded'
    ) {
      return res.status(200).json({ received: true });
    }

    const { status, metadata } = webhookData.object;

    // Извлекаем donation_id из metadata
    const donationId = metadata?.donation_id as string;

    if (!donationId) {
      console.error('No donation_id in webhook metadata');
      return res.status(400).json({ error: 'No donation_id provided' });
    }

    // Обновляем статус доната
    if (status === 'succeeded') {
      await updateDonationStatus(donationId, 'done');
    } else if (status === 'canceled') {
      await updateDonationStatus(donationId, 'cancel');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
