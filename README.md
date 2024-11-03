# Voice Assistant with Wake Word Detection

A voice assistant that uses OpenAI's Realtime API for natural conversations, activated by the wake word "computer".

## Prerequisites

- Node.js 18 or higher
- OpenAI API key
- Picovoice Porcupine access key (get it from [Picovoice Console](https://console.picovoice.ai/))
- System audio input (microphone)
- Windows: Visual Studio Build Tools with C++ workload (for native audio dependencies)

## Setup

1. Clone this repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORCUPINE_ACCESS_KEY=your_porcupine_access_key_here
   ```

   - Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Get your Porcupine access key from [Picovoice Console](https://console.picovoice.ai/)

4. Ensure your microphone is properly configured and set as the default input device

## Usage

1. Start the voice assistant:

   ```bash
   npm start
   ```

2. Say "computer" to activate the assistant

   - The assistant will indicate when it detects the wake word
   - After activation, speak your command or question
   - The assistant will respond through text (in console) and audio
   - It automatically stops listening after 5 seconds of silence
   - Returns to wake word detection mode after each interaction

3. Press Ctrl+C to exit the application

## Features

- Wake word detection using Porcupine (wake word: "computer")
- Natural conversation using OpenAI's Realtime API
- Voice input and output
- Automatic listening timeout after 5 seconds of silence
- Error handling and graceful cleanup
- Console logging of all interactions

## Troubleshooting

1. If you get microphone access errors:

   - Ensure your microphone is properly connected
   - Check system permissions for microphone access
   - Try running the application with administrator privileges

2. If wake word detection isn't working:

   - Speak clearly and at a normal volume
   - Ensure you're using the word "computer"
   - Check that your Porcupine access key is valid

3. If you get API errors:
   - Verify your OpenAI API key is correct and has sufficient credits
   - Check your internet connection
   - Ensure your Porcupine access key is valid

## Note

This is a demonstration project using OpenAI's Realtime API (Beta). The API and its capabilities may change over time. Always refer to the official OpenAI documentation for the most up-to-date information.
