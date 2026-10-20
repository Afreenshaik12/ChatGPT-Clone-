// // Import Express
// import express from 'express';
// import {generate} from './Chatbot.js';

// const app = express();
// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Welcome to chatgpt');
// });

// app.post('/chat', async (req, res) => {
//     const {message} = req.body;

//     console.log(message);

//     const result = await generate(message);

//     res.json({message : result});
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });


import express from 'express';
import cors from 'cors';
import { generate } from './Chatbot.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to chatgpt');
});

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
