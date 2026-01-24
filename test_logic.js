
// Test Regex for AI Prefix
const stripAIPrefix = (content) => {
    let cleaned = content.trim()
    // Original Regex from store.ts:92
    const prefixMatch = cleaned.match(/^\[[\w\-]+\]:\s*/)
    if (prefixMatch) {
        cleaned = cleaned.slice(prefixMatch[0].length)
    }
    return cleaned
}

console.log("--- Regex Test ---")
console.log("Test 1 (Simple):", stripAIPrefix("[Bot]: Hello") === "Hello" ? "PASS" : "FAIL")
console.log("Test 2 (Hyphen):", stripAIPrefix("[Bot-1]: Hello") === "Hello" ? "PASS" : "FAIL")
console.log("Test 3 (Space):", stripAIPrefix("[My Bot]: Hello") === "Hello" ? "PASS" : "FAIL", "(Expected: Hello, Got: " + stripAIPrefix("[My Bot]: Hello") + ")")


// Test Stream Handling
async function testStream() {
    console.log("\n--- Stream Test ---")
    const chunks = [
        'data: {"choices": [{"delta": {"content": "Hel"}}]}\n\ndata: {"choices": [{"delta": {"content": "lo'}}',
'"}}]}\n\n'
  ]

let fullContent = ''

// Simulation of api.ts logic
for (const chunk of chunks) {
    const lines = chunk.split('\n').filter(line => line.trim() !== '')
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
                const parsed = JSON.parse(data)
                fullContent += parsed.choices[0].delta.content
            } catch (e) {
                console.log("Parse Error on:", data)
            }
        } else {
            console.log("Ignored line (doesn't start with data:):", line)
        }
    }
}

console.log("Final Content:", fullContent)
console.log("Result:", fullContent === "Hello" ? "PASS" : "FAIL")
}

testStream()
