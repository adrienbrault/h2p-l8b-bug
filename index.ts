const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

const quants = [
    'q4_K_M',
    'q5_K_M',
    'q6_K',
    'q8_0',
]

let messages = [
    {
        "role": "system",
        "content": "You are a function calling AI model.\nHere are the available tools:\n<tools>\n[\n  {\n \"name\": \"search_10q\",\n \"description\": \"search_10q(data) - Useful to search information from the latest 10-Q form for a\\n    given stock.\\n    The input to this tool should be a pipe (|) separated text of\\n    length two, representing the stock ticker you are interested and what\\n    question you have from it.\\n\\t\\tFor example, `AAPL|what was last quarter's revenue`.\",\n \"parameters\": {\n \"title\": \"search_10qSchema\",\n \"type\": \"object\",\n \"properties\": {\n \"data\": {\n \"title\": \"Data\"\n        }\n      },\n \"required\": [\n \"data\"\n      ]\n    }\n  },\n  {\n \"name\": \"search_10k\",\n \"description\": \"search_10k(data) - Useful to search information from the latest 10-K form for a\\ngiven stock.\\nThe input to this tool should be a pipe (|) separated text of\\nlength two, representing the stock ticker you are interested, what\\nquestion you have from it.\\nFor example, `AAPL|what was last year's revenue`.\",\n \"parameters\": {\n \"title\": \"search_10kSchema\",\n \"type\": \"object\",\n \"properties\": {\n \"data\": {\n \"title\": \"Data\"\n        }\n      },\n \"required\": [\n \"data\"\n      ]\n    }\n  },\n  {\n \"name\": \"get_stock_fundamentals\",\n \"description\": \"get_stock_fundamentals(symbol: str) -> dict - Get fundamental data for a given stock symbol using yfinance API.\\n\\nArgs:\\n    symbol (str): The stock symbol.\\n\\nReturns:\\n    dict: A dictionary containing fundamental data.\\n        Keys:\\n            - 'symbol': The stock symbol.\\n            - 'company_name': The long name of the company.\\n            - 'sector': The sector to which the company belongs.\\n            - 'industry': The industry to which the company belongs.\\n            - 'market_cap': The market capitalization of the company.\\n            - 'pe_ratio': The forward price-to-earnings ratio.\\n            - 'pb_ratio': The price-to-book ratio.\\n            - 'dividend_yield': The dividend yield.\\n            - 'eps': The trailing earnings per share.\\n            - 'beta': The beta value of the stock.\\n            - '52_week_high': The 52-week high price of the stock.\\n            - '52_week_low': The 52-week low price of the stock.\",\n \"parameters\": {\n \"title\": \"get_stock_fundamentalsSchema\",\n \"type\": \"object\",\n \"properties\": {\n \"symbol\": {\n \"title\": \"Symbol\",\n \"type\": \"string\"\n        }\n      },\n \"required\": [\n \"symbol\"\n      ]\n    }\n  },\n  {\n \"name\": \"get_financial_statements\",\n \"description\": \"get_financial_statements(symbol: str) -> dict - Get financial statements for a given stock symbol.\\n\\nArgs:\\nsymbol (str): The stock symbol.\\n\\nReturns:\\ndict: Dictionary containing financial statements (income statement, balance sheet, cash flow statement).\",\n \"parameters\": {\n \"title\": \"get_financial_statementsSchema\",\n \"type\": \"object\",\n \"properties\": {\n \"symbol\": {\n \"title\": \"Symbol\",\n \"type\": \"string\"\n        }\n      },\n \"required\": [\n \"symbol\"\n      ]\n    }\n  }\n]\n</tools>\n\nPlease use <scratchpad> XML tags to record your reasoning and planning before you call the functions as follows:\n<scratchpad>\n{step-by-step reasoning}\n</scratchpad>\nFor each function call return a json object with function name and arguments within <tool_call> XML tags as follows:\n<tool_call>\n{\"arguments\": <args-dict>, \"name\": <function-name>}\n</tool_call>"
    },
    {
        "role": "user",
        "content": "Your task is to Extract key financial data and ratios from NVDA's SEC filings."
    }
];
const promises = [
    ...quants.map(
        quant => fetch(`${ollamaHost}/v1/chat/completions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: `adrienbrault/nous-hermes2pro-llama3-8b:${quant}`,
                max_tokens: 250,
                messages
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
                messages
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
