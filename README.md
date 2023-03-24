# Siena Test
## Description
Backend Engineering Challenge for Siena AI

## 1. CSV to AWS S3 Uploader API Endpoint
This API endpoint allows users to upload a CSV file to an AWS S3 bucket. The CSV file should contain 1000 records in the specified format, and the uploaded CSV file is validated to ensure it adheres to the required format before being uploaded to S3.

### Prerequisites
Before using this endpoint, you must have the following:
- An AWS S3 bucket to upload the CSV file to.
- AWS access key ID and secret access key with the necessary permissions to access the S3 bucket.
- An application capable of making HTTP requests to the API endpoint.

### CSV File Format
The CSV file should contain 1000 records and be in the following format:
```
sender_username, reciever_username, message, channel 
@bogoman,@helloworld, how are you doing?, instagram 
@ashdev,@meowcat,do you ship internationally?,facebook 
```
The header row must be exactly as shown above. The channel column must contain one of the following values: `instagram`, `facebook`, `whatsapp`, or `email`.

### API Endpoint
The API endpoint can be accessed via a POST request to `/csv2s3`. The endpoint expects the CSV file to be sent as a `multipart/form-data` request, with the CSV file contained within a field named `csv`.

#### Request
```
POST /csv2s3 HTTP/1.1
Content-Type: multipart/form-data
```
The request should include the CSV file in the `csv` field.

#### Response
If the CSV file is uploaded successfully, a `200 OK` response will be returned with a JSON object containing a success message:
```
{
  "message": "CSV file uploaded to S3."
}
```

If there is an error with the CSV file format or upload, an error message will be returned with the corresponding HTTP status code:
```
{
  "error": "CSV must contain 1000 records."
}
```
```
{
  "error": "Invalid CSV format."
}
```
```
{
  "error": "Failed to upload CSV file to S3."
}
```

### Implementation
The API endpoint is implemented using Node.js and the `express` framework. The CSV file is validated using the `multer` middleware, which also handles the file upload. The AWS S3 upload is performed using the `@aws-sdk/client-s3` library. The CSV file format is validated by checking the header row against the required format and the `channel` column against the allowed values. If the CSV file is successfully uploaded to S3, a success message is returned. If there is an error with the CSV file format or upload, an error message is returned with the corresponding HTTP status code.

## 2. CSV Processor
This AWS Lambda function is triggered when a CSV file is uploaded to an S3 bucket. It reads the CSV contents, identifies some entities from the "message" field using substrings, and stores the source message and the response for the respective channel in a database.

### Functionality
The CSV processor performs the following actions:
1. Reads the CSV contents from the S3 bucket and converts them to an array of data rows.
2. For each data row, extracts the values for sender username, receiver username, message, and channel.
3. Based on the channel value, retrieves the predefined response for that channel from a dictionary of channel responses.
4. Replaces the sender and receiver usernames in the response string with their actual values.
5. Stores the original message, response, and other metadata in a database using an ORM library.

### Configuration
This Lambda function requires the following environment variables to be set:
- `AWS_REGION`: the AWS region where the S3 bucket is located.
- Database configuration variables such as `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, etc.

The dictionary of channel responses can be modified by editing the `channelResponses` object in the code.

### Dependencies
This Lambda function uses the following dependencies:
- `@aws-sdk/client-s3`: an AWS SDK for Node.js that provides low-level S3 client methods.
- `sequelize`: an ORM library for Node.js that provides an easy-to-use interface for database operations.

### Usage
To use this Lambda function, follow these steps:
1. Deploy the function to AWS Lambda, and set the required environment variables.
2. Create an S3 bucket and set up an event trigger for the Lambda function. The trigger should be set to activate when a CSV file is uploaded to the bucket.
3. Create a database table with columns for the sender username, receiver username, message, channel, and response.
4. Populate the `channelResponses` object in the code with the desired responses for each channel.
5. Upload a CSV file to the S3 bucket, and wait for the Lambda function to be triggered. The function will process the CSV file and insert the data into the database.

## 3. REST API for Conversation and Chat
This is a REST API built using Express.js, which provides two endpoints to handle conversations and chat messages between two participants.

### `/conversation/`
This endpoint returns a list of all conversations between two participants. Each conversation consists of two participants and the last message time between them. The response is paginated based on the `limit` and `offset` query parameters.

#### Request
```
GET /conversation/?limit=10&offset=0
```

#### Query Parameters
- `limit` - The number of results to return per page. Default is 10.
- `offset` - The number of results to skip. Default is 0.

#### Response
```
Status: 200 OK
Content-Type: application/json

[
  {
    "participants": ["participant1", "participant2"],
    "lastMessageTime": "2023-03-23T12:30:00.000Z"
  },
  ...
]
```

### `/conversation/<id>/chat`
This endpoint returns all the messages exchanged between two participants in a conversation. The response is paginated based on the `limit` and `offset` query parameters.

#### Request
```
GET /conversation/participant1,participant2/chat?limit=10&offset=0
```

#### Parameters
- `id` - The conversation id formed by concatenating the two participant usernames separated by a comma.

#### Query Parameters
- `limit` - The number of results to return per page. Default is 10.
- `offset` - The number of results to skip. Default is 0.

#### Response
```
Status: 200 OK
Content-Type: application/json

[
  {
    "sender": "participant1",
    "receiver": "participant2",
    "message": "Hello!",
    "channel": "web",
    "response": null,
    "createdAt": "2023-03-23T12:30:00.000Z"
  },
  ...
]
```

## Data Models
### `Message`
The `Message` model represents a single message in a conversation. It contains five attributes: `senderUsername`, `receiverUsername`, `message`, `channel`, and `response`.

The `sequelize` instance is created with the connection information for the PostgreSQL database, provided through environment variables.

The `Message` class extends the `Model` class from Sequelize, which provides ORM functionalities for interacting with the database. It also implements the `MessageAttributes` interface, which defines the attributes of the model.

The `init` method is called on the `Message` class to initialize the model. It defines the schema for the `messages` table with the five attributes defined above. The `sequelize` instance and the table name are also passed to the method to configure the model's connection to the database.

With this implementation, we can easily create, read, update, and delete messages from the database using Sequelize's ORM functionalities.

## Endpoints
### POST /csv2s3
This endpoint accepts a CSV file as input, validates its format, and uploads it to an S3 bucket.

#### Request
- **Method**: `POST`
- **URL**: `/csv2s3`
- **Request Body**: Form data with the following fields:
 - `csv`: A CSV file containing 1000 records with the following columns:
  - `sender_username` *(string)*: The username of the message sender
  - `receiver_username` *(string)*: The username of the message receiver
  - `message` *(string)*: The message content
  - `channel` *(string)*: The channel used to send the message (one of "instagram", "facebook", "whatsapp", "email")

#### Response
- **Status Code**:
 - `200 OK` if the CSV file is uploaded successfully
 - `400 Bad Request` if the CSV format is invalid
 - `500 Internal Server Error` if there is a server error
- **Response Body**: JSON object with the following fields:
 - `message` *(string)*: A message indicating whether the CSV file was uploaded successfully or not.
 - `error` *(string)*: An error message if the request failed due to an invalid CSV format or a server error.

### GET /conversation
This endpoint retrieves a list of conversations and their last message time, ordered by the time of the last message.

#### Request
- **Method**: `GET`
- **URL**: `/conversation`
- **Query Parameters**:
 - `limit` *(optional, number)*: The maximum number of conversations to return *(default: 10)*.
 - `offset` *(optional, number)*: The number of conversations to skip *(default: 0)*.

#### Response
- **Status Code**:
 - `200 OK` if the conversations are retrieved successfully
 - `500 Internal Server Error` if there is a server error.
- **Response Body**: JSON object with the following fields:
 - `participants` *(array)*: An array containing the usernames of the conversation participants.
 - `lastMessageTime` *(string)*: The time of the last message in the conversation.


### GET /conversation/:id/chat
This endpoint retrieves a conversation between two participants, including their messages and the time they were sent.

#### Request
- **Method**: `GET`
- **URL**: `/conversation/:id/chat`, where `:id` is a comma-separated list of the two participants' usernames.
- **Query Parameters**:
 - `limit` *(optional, number)*: The maximum number of messages to return *(default: 10)*.
 - `offset` *(optional, number)*: The number of messages to skip *(default: 0)*.

#### Response
- **Status Code**:
 - `200 OK` if the conversation is retrieved successfully
 - `500 Internal Server Error` if there is a server error.
- **Response Body**: JSON object with the following fields:
 - `sender` *(string)*: The username of the message sender.
 - `receiver` *(string)*: The username of the message receiver.
 - `message` *(string)*: The message content.
 - `channel` *(string)*: The channel used to send the message.
 - `response` *(string)*: The response to the message (if any).
 - `createdAt` *(string)*: The time the message was sent.

## Contributing
### Process
We use a fork-and-PR process, also known as a triangular workflow. This process
is fairly common in open-source projects. Here's the basic workflow:

1. Fork the upstream repo to create your own repo. This repo is called the origin repo.
2. Clone the origin repo to create a working directory on your local machine.
3. Work your changes on a branch in your working directory, then add, commit, and push your work to your origin repo.
4. Submit your changes as a PR against the upstream repo. You can use the upstream repo UI to do this.
5. Maintainers review your changes. If they ask for changes, you work on your
   origin repo's branch and then submit another PR. Otherwise, if no changes are made,
   then the branch with your PR is merged to upstream's main trunk, the main branch.

When you work in a triangular workflow, you have the upstream repo, the origin
repo, and then your working directory (the clone of the origin repo). You do
a `git fetch` from upstream to local, push from local to origin, and then do a PR from origin to
upstream&mdash;a triangle.

If this workflow is too much to understand to start, that's ok! You can use
GitHub's UI to make a change, which is autoset to do most of this process for
you. We just want you to be aware of how the entire process works before
proposing a change.

Thank you for your contributions; we appreciate you!

### License
Note that we use a standard [MIT](./LICENSE) license on this repo.

### Coding style
Code style is enforced by [`eslint`]('https://eslint.org'). Linting is applied CI builds when a pull request
is made.

### Questions?
The easiest way to get our attention is to comment on an existing, or open a new
[issue]('https://github.com/smusali/sienatest/issues').
