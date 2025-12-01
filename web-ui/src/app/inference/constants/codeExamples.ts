import type { Provider } from '@/shared/types/broker'

export type TabType = 'curl' | 'javascript' | 'python'

export const CODE_TABS = [
    { key: 'curl' as const, label: 'cURL' },
    { key: 'javascript' as const, label: 'JavaScript' },
    { key: 'python' as const, label: 'Python' },
]

export function getQuickStartCodeExample(tab: TabType): string {
    const examples = {
        curl: `curl http://127.0.0.1:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`,
        javascript: `const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'http://127.0.0.1:3000/v1',
  apiKey: ''
});

async function main() {
  const completion = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello!'
      }
    ],
  });

  console.log(completion.choices[0].message);
}

main();`,
        python: `from openai import OpenAI

client = OpenAI(
    base_url='http://127.0.0.1:3000/v1',
    api_key=''
)

completion = client.chat.completions.create(
    messages=[
        {
            'role': 'system',
            'content': 'You are a helpful assistant.'
        },
        {
            'role': 'user',
            'content': 'Hello!'
        }
    ]
)

print(completion.choices[0].message)`,
    }
    return examples[tab] || examples.curl
}

export function getSDKExample(
    tab: TabType,
    serviceType?: string,
    provider?: Provider | null
): string {
    const serviceUrl = provider?.url || '<service.url>'
    const serviceModel = provider?.model || '<service.model>'

    if (serviceType === 'speech-to-text') {
        const examples = {
            curl: `curl ${serviceUrl}/v1/proxy/audio/transcriptions \\
  -H "Authorization: Bearer app-sk-<SECRET>" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@audio.ogg" \\
  -F "model=${serviceModel}" \\
  -F "response_format=json"`,
            javascript: `const OpenAI = require('openai');
const fs = require('fs');

const client = new OpenAI({
  baseURL: '${serviceUrl}/v1/proxy',
  apiKey: 'app-sk-<SECRET>'
});

async function main() {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream('audio.ogg'),
    model: '${serviceModel}',
    response_format: 'json'
  });

  console.log(transcription.text);
}

main();`,
            python: `from openai import OpenAI

client = OpenAI(
    base_url='${serviceUrl}/v1/proxy',
    api_key='app-sk-<SECRET>'
)

with open('audio.ogg', 'rb') as audio_file:
    transcription = client.audio.transcriptions.create(
        file=audio_file,
        model='${serviceModel}',
        response_format='json'
    )

print(transcription.text)`,
        }
        return examples[tab] || examples.curl
    } else if (serviceType === 'text-to-image') {
        const examples = {
            curl: `curl ${serviceUrl}/v1/proxy/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer app-sk-<SECRET>" \\
  -d '{
    "model": "${serviceModel}",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "512x512",
    "response_format": "b64_json"
  }' | jq -r ".data[0].b64_json" | base64 -d > output.png && open output.png`,
            javascript: `const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: '${serviceUrl}/v1/proxy',
  apiKey: 'app-sk-<SECRET>'
});

async function main() {
  const response = await client.images.generate({
    model: '${serviceModel}',
    prompt: 'A cute baby sea otter',
    n: 1,
    size: '512x512'
  });

  console.log(response.data);
}

main();`,
            python: `from openai import OpenAI

client = OpenAI(
    base_url='${serviceUrl}/v1/proxy',
    api_key='app-sk-<SECRET>'
)

response = client.images.generate(
    model='${serviceModel}',
    prompt='A cute baby sea otter',
    n=1,
    size='512x512'
)

print(response.data)`,
        }
        return examples[tab] || examples.curl
    } else {
        // For chatbot/text type
        const examples = {
            curl: `curl ${serviceUrl}/v1/proxy/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer app-sk-<SECRET>" \\
  -d '{
    "model": "${serviceModel}",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`,
            javascript: `const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: '${serviceUrl}/v1/proxy',
  apiKey: 'app-sk-<SECRET>'
});

async function main() {
  const completion = await client.chat.completions.create({
    model: '${serviceModel}',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello!'
      }
    ]
  });

  console.log(completion.choices[0].message);
}

main();`,
            python: `from openai import OpenAI

client = OpenAI(
    base_url='${serviceUrl}/v1/proxy',
    api_key='app-sk-<SECRET>'
)

completion = client.chat.completions.create(
    model='${serviceModel}',
    messages=[
        {
            'role': 'system',
            'content': 'You are a helpful assistant.'
        },
        {
            'role': 'user',
            'content': 'Hello!'
        }
    ]
)

print(completion.choices[0].message)`,
        }
        return examples[tab] || examples.curl
    }
}
