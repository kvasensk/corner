import type { NextApiRequest, NextApiResponse } from 'next';

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  return_url: string;
  metadata?: Record<string, string>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, description, return_url }: PaymentRequest =
      req.body;

    // Валидация обязательных полей
    if (!amount || !currency || !description || !return_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Здесь будет интеграция с API ЮKassa
    // Пока возвращаем mock данные для тестирования
    const mockPaymentId = `payment_${Date.now()}`;
    const mockConfirmationUrl = `${return_url}?payment_id=${mockPaymentId}`;

    // В реальном приложении здесь будет:
    // 1. Авторизация в API ЮKassa
    // 2. Создание платежа
    // 3. Получение payment_id и confirmation_url

    res.status(200).json({
      payment_id: mockPaymentId,
      confirmation_url: mockConfirmationUrl,
      status: 'pending',
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
