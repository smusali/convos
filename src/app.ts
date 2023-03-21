import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const app = express();
const upload = multer({ dest: 'uploads/' });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

app.post('/csv2s3', upload.single('csv'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the format of the CSV
    const csv = req.file?.buffer.toString();
    const csvRows = csv?.trim().split('\n');
    if (csvRows?.length !== 1000) {
      return res.status(400).send({ error: 'CSV must contain 1000 records.' });
    }
    const csvHeaders = csvRows[0].trim().split(',');
    if (csvHeaders?.length !== 4 ||
        csvHeaders[0].trim() !== 'sender_username' ||
        csvHeaders[1].trim() !== 'reciever_username' ||
        csvHeaders[2].trim() !== 'message' ||
        !['instagram', 'facebook', 'whatsapp', 'email'].includes(csvHeaders[3].trim())) {
      return res.status(400).send({ error: 'Invalid CSV format.' });
    }

    // Upload the CSV file to S3
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const objectKey = req.file?.originalname!;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: req.file?.buffer,
    });
    await s3.send(command);

    return res.send({ message: 'CSV file uploaded to S3.' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Failed to upload CSV file to S3.' });
  }
});

export default app;
