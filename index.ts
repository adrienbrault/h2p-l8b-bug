const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

const systemMessage = `
You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> {"type": "function", "function": {"name": "get_stock_fundamentals", "description": "get_stock_fundamentals(symbol: str) -> dict - Get fundamental data for a given stock symbol using yfinance API.\\\\n\\\\n    Args:\\\\n        symbol (str): The stock symbol.\\\\n\\\\n    Returns:\\\\n        dict: A dictionary containing fundamental data.\\\\n            Keys:\\\\n                - \\'symbol\\': The stock symbol.\\\\n                - \\'company_name\\': The long name of the company.\\\\n                - \\'sector\\': The sector to which the company belongs.\\\\n                - \\'industry\\': The industry to which the company belongs.\\\\n                - \\'market_cap\\': The market capitalization of the company.\\\\n                - \\'pe_ratio\\': The forward price-to-earnings ratio.\\\\n                - \\'pb_ratio\\': The price-to-book ratio.\\\\n                - \\'dividend_yield\\': The dividend yield.\\\\n                - \\'eps\\': The trailing earnings per share.\\\\n                - \\'beta\\': The beta value of the stock.\\\\n                - \\'52_week_high\\': The 52-week high price of the stock.\\\\n                - \\'52_week_low\\': The 52-week low price of the stock.", "parameters": {"type": "object", "properties": {"symbol": {"type": "string"}}, "required": ["symbol"]}}}  </tools> Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"} For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
<tool_call>
{"arguments": <args-dict>, "name": <function-name>}
</tool_call>`;
const userMessage = `Fetch the stock fundamentals data for Tesla (TSLA)`;

const quants = [
    'q4_K_M',
    'q5_K_M',
    'q6_K',
    'q8_0',
]

const promises = [
    ...quants.map(
        quant => fetch(`${ollamaHost}/v1/chat/completions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: `adrienbrault/nous-hermes2pro-llama3-8b:${quant}`,
                max_tokens: 50,
                messages: [
                    {
                        role: "system",
                        content: systemMessage,
                    },
                    {
                        role: "user",
                        content: userMessage,
                    },
                ]
            }),
        })
    ),
    ...quants.map(
        quant => fetch(`${ollamaHost}/api/chat`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: `adrienbrault/nous-hermes2pro-llama3-8b:${quant}`,
                options: {
                    num_predict: 50,
                },
                stream: false,
                messages: [
                    {
                        role: "system",
                        content: systemMessage,
                    },
                    {
                        role: "user",
                        content: userMessage,
                    },
                ]
            }),
        })
    ),
];

const responses = await Promise.all(promises);

responses.forEach(async response => {
    const data = await response.json();

    console.log({
        endpoint: response.url,
        model: data.model,
        content: Array.isArray(data.choices) ? data.choices[0].message.content : data.message.content,
    });
});
