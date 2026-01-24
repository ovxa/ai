
// Verification Script for Logical Fixes

// 1. Mock functions from code
const stripAIPrefix = (content) => {
    let cleaned = content.trim()
    // New Regex
    const prefixMatch = cleaned.match(/^\[[^\]]+\]:\s*/)
    if (prefixMatch) {
        cleaned = cleaned.slice(prefixMatch[0].length)
    }
    return cleaned
}

// 2. Test Regex
console.log("--- Regex Verification ---")
const testCases = [
    { input: "[Bot]: Hello", expected: "Hello" },
    { input: "[Bot-1]: Hello", expected: "Hello" },
    { input: "[My Bot]: Hello", expected: "Hello" },
    { input: "[Bot Name With Spaces]: Content", expected: "Content" },
    { input: "No prefix here", expected: "No prefix here" }
]

let regexPass = true
testCases.forEach((test, i) => {
    const result = stripAIPrefix(test.input)
    if (result !== test.expected) {
        console.log(`FAIL: Case ${i + 1}. Expected '${test.expected}', Got '${result}'`)
        regexPass = false
    } else {
        console.log(`PASS: Case ${i + 1}`)
    }
})

// 3. Test Stream Buffer Logic
console.log("\n--- Stream Buffer Verification ---")
async function testStreamBuffer() {
    // Correctly escaped JSON strings for test chunks
    const chunks = [
        'data: {"choices": [{"delta": {"con',
        'tent": "Hel"}}]}\n\ndata: {"choices": [{"delta": {"content": "lo',
        '"}}]}\n\n'
    ]

    let fullContent = ''
    let buffer = '' // The buffer logic we added

    for (const chunk of chunks) {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (line.trim() === '') continue
            if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                    const parsed = JSON.parse(data)
                    fullContent += parsed.choices[0].delta.content
                } catch (e) {
                    // Should not happen with correct buffer
                    console.log("Parse error (unexpected):", e.message)
                    console.log("Bad Chunk:", data)
                }
            }
        }
    }

    console.log(`Final Content: '${fullContent}'`)
    if (fullContent === "Hello") {
        console.log("PASS: Streaming buffer correctly handled split chunks")
        return true
    } else {
        console.log("FAIL: Streaming buffer failed to reconstruct content")
        return false
    }
}

const streamPass = await testStreamBuffer()

if (regexPass && streamPass) {
    console.log("\nALL TESTS PASSED")
} else {
    console.log("\nSOME TESTS FAILED")
    process.exit(1)
}
