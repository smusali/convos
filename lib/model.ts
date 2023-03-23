import { Sequelize, Model, DataTypes } from 'sequelize'

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'postgres'
})

interface MessageAttributes {
  senderUsername: string
  receiverUsername: string
  message: string
  channel: string
  response: string
}

class Message extends Model<MessageAttributes> implements MessageAttributes {
  public senderUsername!: string
  public receiverUsername!: string
  public message!: string
  public channel!: string
  public response!: string
}

Message.init(
  {
    senderUsername: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receiverUsername: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    response: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'messages'
  }
)

export default Message
