import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers (COOP disabled for Firebase signInWithPopup)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Gzip compression for all responses
app.use(compression());

// Request logging
app.use(morgan("combined"));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint (required by Cloud Run)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
// Tambahkan : Request dan : Response di setiap parameter
app.post("/api/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, count = 10, level = 'N5' } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a ${count}-question quiz for Japanese JLPT ${level} level. 
      Mode: ${mode}. 
      Return a JSON array of objects with fields: 
      - question: The kanji, sentence, or word.
      - options: Array of 4 strings.
      - answerIndex: Index of correct option (0-3).
      - reading: (Optional) Hiragana reading if applicable.
      - meaning: (Optional) English meaning.
      - explanation: Brief explanation in English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answerIndex: { type: Type.INTEGER },
              reading: { type: Type.STRING },
              meaning: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["question", "options", "answerIndex", "explanation"]
          }
        }
      }
    });

    res.json(JSON.parse(response.text as string));
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/scan", async (req: Request, res: Response): Promise<void> => {
  try {
    const { image, level = 'N5' } = req.body; // Base64 encoded image
    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image.split(',')[1] || image
          }
        },
        {
          text: `Extract all Japanese Kanji found in this image. Create a comprehensive quiz based on the extracted Kanji, targeting JLPT ${level} level difficulty. Also determine the primary English concept or theme of the Kanji. Return a JSON object with 'theme' and 'questions' array. Each question should test either meaning, reading, or usage.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING, description: "The primary English concept or meaning of the extracted Kanji (e.g. Fire, Water, Tech, etc.)" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answerIndex: { type: Type.INTEGER },
                  reading: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["question", "options", "answerIndex", "explanation"]
              }
            }
          },
          required: ["theme", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text as string);
    let bossImageBase64 = null;
    
    if (parsed.theme) {
      try {
        const imageResult = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: `Retro 16-bit vaporwave cyberpunk pixel art boss monster representing the concept of ${parsed.theme}. Neon colors, dark background, arcade game sprite.`,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1"
          }
        });
        bossImageBase64 = imageResult.generatedImages?.[0]?.image?.imageBytes;
      } catch (e) {
        console.error("Image generation failed:", e);
      }
    }

    res.json({ questions: parsed.questions, bossImageBase64 });
  } catch (error) {
    console.error("Scan error:", error);
    res.status(500).json({ error: "Failed to scan image" });
  }
});

app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, level = 'N5' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "No messages provided" });
      return;
    }

    const systemInstruction = `You are Sacho (Manager) at a Japanese Engineering company. 
        The student is applying for a job. 
        STRICT RULES:
        1. Use ONLY JLPT ${level} level vocabulary and grammar.
        2. Speak in polite form (desu/masu).
        3. Be encouraging but professional.
        4. Focus on workplace topics: self-introduction, skills, office etiquette, schedules.
        5. Keep responses concise (under 2-3 sentences).
        6. Ask context-aware questions about the latest real-world web development and tech trends happening in Japan right now.`;

    const lastMessage = messages[messages.length - 1].content;

    // Try with googleSearch first, fallback without it
    let responseText: string | undefined;
    try {
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });
      const response = await chat.sendMessage({ message: lastMessage });
      responseText = response.text;
    } catch (toolError: any) {
      console.warn("Chat with googleSearch failed, retrying without tools:", toolError?.message || toolError);
      // Fallback: retry without googleSearch tool
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction }
      });
      const response = await chat.sendMessage({ message: lastMessage });
      responseText = response.text;
    }

    res.json({ content: responseText });
  } catch (error: any) {
    console.error("Chat error:", error?.message || error);
    console.error("Chat error stack:", error?.stack);
    res.status(500).json({ error: "Failed to process chat", details: error?.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully...');
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });

    // Force close after 10 seconds if connections are hanging
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer();