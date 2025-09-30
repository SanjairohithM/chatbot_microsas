// Simple test for PDF chunking
console.log('🧪 Testing PDF chunking...')

// Test content
const content = `This is a sample PDF document. It has multiple sentences. Some are short. Others are longer and contain more detailed information that might need to be split across chunks. The chunking algorithm should handle this properly.`

console.log('Original content:', content)
console.log('Length:', content.length)

// Simple chunking function
function simpleChunk(content, maxSize = 100) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
      ? sentence 
      : sentence + '.'
    
    if (currentChunk.length + sentenceWithPunctuation.length + 1 > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentenceWithPunctuation
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(chunk => chunk.length >= 20)
}

const chunks = simpleChunk(content, 80)
console.log('\nGenerated chunks:')
chunks.forEach((chunk, index) => {
  console.log(`${index + 1}. (${chunk.length} chars) ${chunk}`)
})

console.log('\n✅ Test completed!')
