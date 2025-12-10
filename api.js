// API configuration and generation logic
const MODEL_MAP = {
  'GPT-4.1 Nano': 'openai-fast',
  'Mistral Small 3': 'mistral',
  'GPT-4.1 Mini': 'openai',
  'Llama 4 Scout 17B': 'llamascout',
  'DeepSeek V3': 'deepseek',
  'Qwen 2.5 Coder 32B': 'qwen-coder',
  'Llama 3.3 70B': 'llama',
  'o3': 'openai-reasoning',
  'GPT-4.1': 'openai-large',
  'DeepSeek R1': 'deepseek-reasoning',
  'Grok 3 Mini': 'grok'
};

const SYSTEM_PROMPT = `Create modern web applications using only HTML, CSS, and JavaScript. If you need icons, import the appropriate library first. Use TailwindCSS for styling when possible (make sure to import <script src="https://cdn.tailwindcss.com"></script> in the head). If TailwindCSS cannot achieve what you need, use custom CSS.

Create comprehensive, polished applications with:
- Modern, clean design with dark themes and subtle effects
- Smooth animations and transitions
- Responsive layouts that work on all devices
- Intuitive user interfaces
- Well-structured, maintainable code

RESPONSE FORMAT:
I always respond in this exact JSON structure:
{
  "files": [
    {
      "filename": "index.html",
      "type": "html",
      "content": "file contents"
    }
  ],
  "yapping": "Explanation of the project and its features"
}

Any explanations are ONLY included in the 'yapping' field. I never include explanations outside the JSON or in code blocks.`;

async function generateContent(prompt, imageData = null) {
  const selectedModelName = document.getElementById('selectedModelName').textContent;
  const apiModel = MODEL_MAP[selectedModelName] || 'openai';

  // Create user message with image support
  let userMessage;
  if (imageData) {
    userMessage = {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: imageData }
        }
      ]
    };
  } else {
    userMessage = {
      role: 'user',
      content: prompt
    };
  }

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    ...conversationHistory,
    userMessage
  ];

  const response = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: apiModel,
      messages: messages,
      temperature: 0.7,
      private: false
    })
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from API');
  }

  return { content, fullResponse: content };
}

function parseAPIResponse(content) {
  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonString = jsonMatch[0];
      
      jsonString = jsonString.replace(/("content":\s*)`([\s\S]*?)`(\s*[,}])/g, (match, prefix, templateContent, suffix) => {
        const escapedContent = templateContent
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `${prefix}"${escapedContent}"${suffix}`;
      });
      
      try {
        parsedContent = JSON.parse(jsonString);
      } catch (e2) {
        const htmlMatch = content.match(/(<!DOCTYPE html[\s\S]*?<\/html>)/);
        if (htmlMatch) {
          parsedContent = {
            files: [{
              filename: 'index.html',
              type: 'html',
              content: htmlMatch[1]
            }],
            yapping: 'Generated HTML content'
          };
        } else {
          throw new Error('Unable to parse response content');
        }
      }
    } else {
      throw new Error('No valid JSON or HTML found in response');
    }
  }
  
  return parsedContent;
}