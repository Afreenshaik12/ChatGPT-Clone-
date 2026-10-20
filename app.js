import Groq from "groq-sdk";
import readline from "node:readline/promises";
import "dotenv/config";
import { stdin, stdout } from "node:process";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


async function main() {

    const messages = [
        {
            role: 'system',
            content: 'You are Sumaiya, a smart personal assistant. Use Gen Z slang naturally. Use web search results when provided to answer the users question.'
        }
    ];

    
    const tools = [
    {
        type: "function",
        function: {
        name: "webSearch",
        description:
            "Search the web for current information or facts that need verification.",
        parameters: {
            type: "object",
            properties: {
            query: {
                type: "string",
                description: "The search query to send to the web search engine.",
            },
            },
            required: ["query"],
        },
        },
    },
    ];


    const r1 = readline.createInterface({
        input: stdin,
        output: stdout,
    });

    try{
        while(true){
            const userInput = await r1.question("You: ");

            if(userInput.trim().toLowerCase() == 'exit'){
                console.log("AI: Goodbye! see you next time.");
                break;
            }

            messages.push({
                role: 'user',
                content: userInput,
            });

            const completion = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages,
                tools,
                tool_choice: "auto",
            });

            
            const assistantMessage = completion.choices[0].message;

            // Save Groq's response in the conversation history
            messages.push(assistantMessage);

            if (assistantMessage.tool_calls?.length) {
            for (const tool of assistantMessage.tool_calls) {
                const functionName = tool.function.name;
                const functionParams = JSON.parse(tool.function.arguments);

                if (functionName === "webSearch") {
                const toolResult = await webSearch(functionParams);

                console.log("Search results:", toolResult);

                messages.push({
                    role: "tool",
                    tool_call_id: tool.id,
                    content: JSON.stringify(toolResult),
                });
                }
            }
            } else {
            console.log(`AI: ${assistantMessage.content}`);
            }

        }
    }finally{
        r1.close();
    }

    
//   const messagess = [
//     {
//       role: "system",
//       content:
//         "You are Sumaiya, a smart personal assistant. Use Gen Z slang naturally. Use web search results when provided to answer the user's question.",
//     },
//     {
//       role: "user",
//       content: "What is the weather update in chennai? ",
//     },
//   ];

//   const tools = [
//     {
//       type: "function",
//       function: {
//         name: "webSearch",
//         description: "Search the web for information relevant to the user's query.",
//         parameters: {
//           type: "object",
//           properties: {
//             query: {
//               type: "string",
//               description: "The search query to perform.",
//             },
//           },
//           required: ["query"],
//         },
//       },
//     },
//   ];

//   // STEP 1: Ask Groq what to do
//   const completion = await groq.chat.completions.create({
//     model: "openai/gpt-oss-20b",
//     messagess,
//     tools,
//     tool_choice: "auto",
//   });

//   const assistantmessages = completion.choices[0].messages;

//   // Save Groq's response, including its tool call
//   messagess.push(assistantmessages);

//   // STEP 2: If no tool is needed, print the answer
//   if (!assistantmessages.tool_calls?.length) {
//     console.log("AI:", assistantmessages.content);
//     return;
//   }

//   // STEP 3: Execute each requested tool
//   for (const tool of assistantmessages.tool_calls) {
//     const functionName = tool.function.name;
//     const functionParams = JSON.parse(tool.function.arguments);

//     let toolResult;

//     if (functionName === "webSearch") {
//       toolResult = await webSearch(functionParams);
//     } else {
//       toolResult = { error: "Unknown tool requested" };
//     }

//     console.log("Search results:", toolResult);

//     // STEP 4: Send the tool result back to Groq
//     messagess.push({
//       role: "tool",
//       tool_call_id: tool.id,
//       content: JSON.stringify(toolResult),
//     });
//   }

//   // STEP 5: Ask Groq to generate the final answer
  
//     const finalCompletion = await groq.chat.completions.create({
//     model: "openai/gpt-oss-20b",
//     messagess: [
//         ...messagess,
//         {
//         role: "system",
//         content:
//             "Answer the user's question using the search results already provided. Do not request or call any more tools. If the results contain the answer, give a clear and concise response."
//         }
//     ],
//     tool_choice: "none"
//     });

//     console.log("AI:", finalCompletion.choices[0].messages.content);


}


main();


async function webSearch({ query }) {
  const response = await fetch(
    "https://google.serper.dev/search",
    {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Serper API error: ${error}`);
  }

  const data = await response.json();

  return data.organic.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
  }));

    // console.log(response);
}
