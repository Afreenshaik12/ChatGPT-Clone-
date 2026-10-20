import Groq from "groq-sdk";
import "dotenv/config";
import NodeCache from "node-cache";
const cache = new NodeCache({stdTTL: 60*60*24});//stdTTL -> time to leave(sec) here it is for 24hrs



const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


export async function generate(userMessage, threadID) {

    const baseMessages = [
        {
            role: 'system',
            content: 'You are Sumaiya, a smart personal assistant. Use Gen Z slang naturally. Use web search results when provided to answer the users question.'
        }
    ];

    //first we'll check if the thread already exist
    const messages = cache.get(threadID) ?? baseMessages;

    
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

    try{
        while(true){

            messages.push({
                role: 'user',
                content: userMessage,
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
                //we r ending the ai response
                cache.set(threadID, messages);//storing the response in the cache
                return assistantMessage.content;
            // console.log(`AI: ${assistantMessage.content}`);
            }

        }
    }finally{

    }

}



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
