import WebSocket from 'ws';
import dotenv from 'dotenv';
import { Porcupine } from '@picovoice/porcupine-node';
import Microphone from 'node-microphone';

dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.PORCUPINE_ACCESS_KEY) {
    console.error("Error: OPENAI_API_KEY and PORCUPINE_ACCESS_KEY must be set in .env file");
    process.exit(1);
}

// Initialize microphone
let mic = null;
try {
    mic = new Microphone();
} catch (error) {
    console.error("Error initializing microphone:", error);
    process.exit(1);
}

// Initialize wake word detector with built-in "computer" keyword
let porcupine = null;
try {
    porcupine = new Porcupine(
        process.env.PORCUPINE_ACCESS_KEY,
        ["computer"], // Using built-in keyword
        [0.7]
    );
} catch (error) {
    console.error("Error initializing Porcupine:", error);
    process.exit(1);
}

// OpenAI WebSocket connection
let ws = null;
let isListening = false;
let silenceTimer = null;
let audioStream = null;

// Connect to OpenAI's Realtime API
function connectToOpenAI() {
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    ws = new WebSocket(url, {
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    ws.on("open", () => {
        console.log("Connected to OpenAI");
        // Initialize the conversation with instructions
        ws.send(JSON.stringify({
            type: "response.create",
            response: {
                modalities: ["text", "audio"],
                instructions: "You are a helpful voice assistant. Keep responses concise and natural. Your knowledge cutoff is 2023-10. Act like a human, but remember that you aren't a human and that you can't do human things in the real world.",
            }
        }));
    });

    ws.on("message", (data) => {
        const event = JSON.parse(data.toString());
        handleOpenAIResponse(event);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        stopListening();
    });

    ws.on("close", () => {
        console.log("Disconnected from OpenAI");
        ws = null;
    });
}

// Handle responses from OpenAI
function handleOpenAIResponse(event) {
    switch (event.type) {
        case "response.output_item.added":
            if (event.item.content && event.item.content[0].text) {
                console.log("Assistant:", event.item.content[0].text);
            }
            break;
        case "response.done":
            console.log("Response complete");
            stopListening();
            break;
        case "error":
            console.error("OpenAI Error:", event.error);
            stopListening();
            break;
    }
}

// Start listening for wake word
function startWakeWordDetection() {
    console.log("Listening for wake word 'computer'...");
    
    try {
        audioStream = mic.startRecording();
        
        audioStream.on('data', (data) => {
            try {
                // Process audio data for wake word detection
                const wakeWordDetected = porcupine.process(data);
                
                if (wakeWordDetected) {
                    console.log("Wake word detected!");
                    startListening();
                }
            } catch (error) {
                console.error("Error processing audio for wake word:", error);
            }
        });

        audioStream.on('error', (error) => {
            console.error("Audio stream error:", error);
        });
    } catch (error) {
        console.error("Error starting audio recording:", error);
    }
}

// Reset silence timer
function resetSilenceTimer() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
    }
    silenceTimer = setTimeout(() => {
        console.log("Silence detected, stopping listening");
        stopListening();
    }, 5000); // 5 seconds of silence
}

// Start listening for user input after wake word
function startListening() {
    if (isListening) return;
    
    isListening = true;
    console.log("Listening for your command...");
    
    // Connect to OpenAI if not already connected
    if (!ws) {
        connectToOpenAI();
    }
    
    // Start streaming audio to OpenAI
    try {
        if (audioStream) {
            audioStream.removeAllListeners('data');
            
            audioStream.on('data', (data) => {
                if (!isListening) return;
                
                resetSilenceTimer();
                
                // Send audio data to OpenAI
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "conversation.item.create",
                        item: {
                            type: "message",
                            role: "user",
                            content: [{
                                type: "input_audio",
                                audio: data.toString('base64')
                            }]
                        }
                    }));
                }
            });
        }
    } catch (error) {
        console.error("Error starting command listening:", error);
        stopListening();
    }
}

// Stop listening for user input
function stopListening() {
    if (!isListening) return;
    
    isListening = false;
    console.log("Stopped listening");
    
    // Clear silence timer
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
    
    // Close WebSocket connection
    if (ws) {
        ws.close();
        ws = null;
    }
    
    // Reset audio stream for wake word detection
    if (audioStream) {
        audioStream.removeAllListeners('data');
        startWakeWordDetection();
    }
}

// Start the application
console.log("Starting voice assistant...");
startWakeWordDetection();

// Handle cleanup
process.on('SIGINT', () => {
    console.log("Shutting down...");
    if (ws) ws.close();
    if (audioStream) {
        audioStream.removeAllListeners('data');
        mic.stopRecording();
    }
    if (porcupine) {
        porcupine.release();
    }
    process.exit();
});
