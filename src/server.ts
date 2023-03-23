import app from './app'

async function init (): Promise<void> {
  try {
    await new Promise((resolve, reject) => {
      app.listen(3001, () => {
        console.log('Express App Listening on Port 3001')
      })
    })
    console.log('Express App Listening on Port 3001')
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`)
    process.exit(1)
  }
}

init().catch((error: any) => {
  console.error(`An error occurred while initializing the app: ${JSON.stringify(error)}`)
  process.exit(1)
})
