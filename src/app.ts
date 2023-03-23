import express, { type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Sequelize, Op } from 'sequelize'
import Message from '../lib/model'

const app = express()
const upload = multer({ dest: 'uploads/' })

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
  }
})

app.post('/csv2s3', upload.single('csv'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate the format of the CSV
    const csv = req.file?.buffer.toString()
    const csvRows = csv?.trim().split('\n')
    if (csvRows?.length !== 1000) {
      res.status(400).send({ error: 'CSV must contain 1000 records.' })
    }
    const csvHeaders = csvRows?.[0]?.trim().split(',')
    if (csvHeaders?.length !== 4 ||
        csvHeaders[0].trim() !== 'sender_username' ||
        csvHeaders[1].trim() !== 'reciever_username' ||
        csvHeaders[2].trim() !== 'message' ||
        !['instagram', 'facebook', 'whatsapp', 'email'].includes(csvHeaders[3].trim())) {
      res.status(400).send({ error: 'Invalid CSV format.' })
    }

    // Upload the CSV file to S3
    const bucketName = process.env.AWS_S3_BUCKET_NAME ?? ''
    const objectKey = req.file?.originalname ?? ''
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: req.file?.buffer
    })
    await s3.send(command)

    res.send({ message: 'CSV file uploaded to S3.' })
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to upload CSV file to S3.' })
  }
})

app.get('/conversation', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) ?? 10
    const offset = parseInt(req.query.offset as string) ?? 0
    const result = await Message.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('sender_username')), 'sender_username'],
        [Sequelize.fn('DISTINCT', Sequelize.col('receiver_username')), 'receiver_username'],
        [Sequelize.fn('MAX', Sequelize.col('created_at')), 'last_message_time']
      ],
      group: ['sender_username', 'receiver_username'],
      order: [[Sequelize.literal('last_message_time'), 'DESC']],
      offset,
      limit
    })

    const conversations = result.map((row: any) => {
      return {
        participants: [row.sender_username, row.receiver_username],
        lastMessageTime: row.last_message_time
      }
    })

    res.json(conversations)
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to retrieve conversations.' })
  }
})

app.get('/conversation/:id/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const participants = req.params.id.split(',')
    const limit = parseInt(req.query.limit as string) ?? 10
    const offset = parseInt(req.query.offset as string) ?? 0
    const result = await Message.findAll({
      where: {
        [Op.or]: [
          { senderUsername: participants[0], receiverUsername: participants[1] },
          { senderUsername: participants[1], receiverUsername: participants[0] }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const messages = result.map((row: any) => {
      return {
        sender: row.sender_username,
        receiver: row.receiver_username,
        message: row.message,
        channel: row.channel,
        response: row.response,
        createdAt: row.created_at
      }
    })

    res.json(messages)
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to retrieve the chat.' })
  }
})

export default app
