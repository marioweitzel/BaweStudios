import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'mock';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4-mini';

// Respuesta mock para testing sin API keys
const MOCK_RESPONSES = [
  "¿Cuál es el nombre de tu proyecto web?",
  "¿Qué tipo de negocio vas a desarrollar? (ecommerce, blog, SaaS, landing page)",
  "¿Quiénes son tus usuarios principales?",
  "¿Cuáles son las funcionalidades principales que necesitas?"
];

let responseIndex = 0;

export async function generateAgentQuestion(userMessage: string): Promise<string> {
  console.log(`[LLM] Provider: ${LLM_PROVIDER}, Model: ${LLM_MODEL}`);
  console.log(`[LLM] User message: "${userMessage}"`);

  try {
    if (LLM_PROVIDER === 'openai' && openai) {
      return await callOpenAI(userMessage);
    } else if (LLM_PROVIDER === 'anthropic' && anthropic) {
      return await callAnthropic(userMessage);
    } else {
      return generateMockResponse();
    }
  } catch (error) {
    console.error(`[LLM] Error: ${error}`);
    return generateMockResponse();
  }
}

async function callOpenAI(userMessage: string): Promise<string> {
  console.log(`[LLM] Calling OpenAI...`);
  
  const message = await (openai as any).chat.completions.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Eres un asistente que ayuda a crear proyectos web. 
        El usuario ha enviado: "${userMessage}"
        
        Basándote en su mensaje, genera UNA SOLA pregunta para ayudarlo a definir su proyecto.
        La pregunta debe ser concisa y específica.
        Responde SOLO con la pregunta, sin explicación adicional.`
      }
    ]
  });

  const textContent = message.choices[0]?.message?.content;
  if (textContent) {
    const response = textContent.trim();
    console.log(`[LLM] OpenAI response: "${response}"`);
    return response;
  }

  throw new Error('No text content in OpenAI response');
}

async function callAnthropic(userMessage: string): Promise<string> {
  console.log(`[LLM] Calling Anthropic...`);
  
  const message = await anthropic!.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Eres un asistente que ayuda a crear proyectos web. 
        El usuario ha enviado: "${userMessage}"
        
        Basándote en su mensaje, genera UNA SOLA pregunta para ayudarlo a definir su proyecto.
        La pregunta debe ser concisa y específica.
        Responde SOLO con la pregunta, sin explicación adicional.`
      }
    ]
  });

  const textContent = message.content.find((c: any) => c.type === 'text');
  if (textContent && textContent.type === 'text') {
    const response = textContent.text.trim();
    console.log(`[LLM] Anthropic response: "${response}"`);
    return response;
  }

  throw new Error('No text content in Anthropic response');
}

function generateMockResponse(): string {
  const response = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
  responseIndex++;
  console.log(`[LLM] Mock response: "${response}"`);
  return response;
}
