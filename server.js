// // // Import Express
// // import express from 'express';
// // import {generate} from './Chatbot.js';

// // const app = express();
// // app.use(express.json());

// // app.get('/', (req, res) => {
// //     res.send('Welcome to chatgpt');
// // });

// // app.post('/chat', async (req, res) => {
// //     const {message} = req.body;

// //     console.log(message);

// //     const result = await generate(message);

// //     res.json({message : result});
// // });

// // const PORT = process.env.PORT || 3001;
// // app.listen(PORT, () => {
// //     console.log(`Server running on http://localhost:${PORT}`);
// // });

//-----------------------------------------------


// import express from 'express';
// import cors from 'cors';
// import { generate } from './Chatbot.js';

// const app = express();

// app.use(cors({
//   origin: 'http://localhost:3000',
// }));

// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Welcome to chatgpt');
// });

// app.post('/chat', async (req, res) => {
//   try {
//     const { message, threadID } = req.body;

//     if (typeof message !== 'string' || !message.trim()) {
//       return res.status(400).json({
//         error: 'Please provide a message.',
//       });
//     }

//     const result = await generate(message, threadID);

//     res.json({ message: result });
//   } catch (error) {
//     console.error('Chat error:', error);

//     res.status(500).json({
//       error: 'Unable to generate a response.',
//     });
//   }
// });

// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate } from './Chatbot.js';

const app = express();

// Set up directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Added Vite's standard local dev ports
}));

app.use(express.json());

// 1. Serve static files from the compiled React frontend folder
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// API Endpoint for processing chat prompts
app.post('/chat', async (req, res) => {
  try {
    const { message, threadID } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Please provide a message.',
      });
    }

    const result = await generate(message, threadID);

    res.json({ message: result });
  } catch (error) {
    console.error('Chat error:', error);

    res.status(500).json({
      error: 'Unable to generate a response.',
    });
  }
});

// 2. Catch-all route: Every non-API page request serves your main index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Render provides a custom port variable automatically via process.env.PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

