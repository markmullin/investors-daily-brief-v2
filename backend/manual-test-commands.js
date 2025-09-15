// Quick manual test commands for GPT-OSS integration
// Copy and paste these into your terminal to test different endpoints

// 1. Test Health Check
// Expected: Returns GPU info and status
fetch('http://localhost:5000/api/gpt-oss/health')
  .then(r => r.json())
  .then(console.log)

// 2. Test Market Analysis
// Expected: AI-generated market analysis in ~30-40 seconds
fetch('http://localhost:5000/api/gpt-oss/market-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sp500Price: 6466.92,
    sp500Change: 1.5,
    nasdaqPrice: 20000,
    nasdaqChange: 2.1,
    vix: 15,
    treasury10y: 4.5,
    marketPhase: 'BULL'
  })
})
.then(r => r.json())
.then(data => console.log(data.data.analysis))

// 3. Test Concept Explanation
// Expected: Simple explanation of P/E ratio
fetch('http://localhost:5000/api/gpt-oss/explain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    concept: 'P/E ratio',
    context: { portfolio: { value: 50000 } }
  })
})
.then(r => r.json())
.then(data => console.log(data.data.explanation))

// 4. Test Custom Prompt
// Expected: Quick response to simple question
fetch('http://localhost:5000/api/gpt-oss/custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'What are the top 3 things to consider when buying stocks?',
    maxTokens: 100,
    temperature: 0.7
  })
})
.then(r => r.json())
.then(data => console.log(data.data.response))

// 5. Test Chat (non-streaming)
// Expected: Conversational response
fetch('http://localhost:5000/api/gpt-oss/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the VIX and why does it matter?' }
    ],
    stream: false
  })
})
.then(r => r.json())
.then(data => console.log(data.data.content))