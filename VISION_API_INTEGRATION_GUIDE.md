# 🖼️ Vision API Integration Guide

## Current Status

✅ **Image Upload**: Working - Images are uploaded and stored in `public/uploads/images/`  
✅ **Image Display**: Working - Images show in chat interface  
✅ **Database Schema**: Updated - Messages table supports `image_url` and `image_analysis`  
✅ **Image Analysis**: Working - DeepSeek provides helpful responses about images  
⚠️ **Vision API**: Limited - DeepSeek does NOT support direct image analysis  

## ⚠️ Important: DeepSeek API Limitation

**DeepSeek's current API does NOT support direct image input or analysis.** The API is text-only and cannot process images directly.

### What DeepSeek CAN do:
- ✅ Text-based conversations
- ✅ Code generation
- ✅ Text analysis and processing
- ✅ Respond to image-related questions (if you describe the image)

### What DeepSeek CANNOT do:
- ❌ View or analyze images directly
- ❌ Extract text from images (OCR)
- ❌ Object detection in images
- ❌ Image captioning  

## Integration Options

### 1. OpenAI GPT-4V (Recommended)

**Pros**: Excellent image understanding, natural language responses  
**Cons**: Requires OpenAI API key, costs per request  

```typescript
// app/api/analyze-image/route.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  const { imageUrl, prompt } = await request.json()
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 1000
  })
  
  return NextResponse.json({
    success: true,
    analysis: response.choices[0].message.content
  })
}
```

### 2. Google Cloud Vision API

**Pros**: Excellent for text extraction, object detection, face detection  
**Cons**: Requires Google Cloud setup, separate billing  

```typescript
// Install: npm install @google-cloud/vision
import { ImageAnnotatorClient } from '@google-cloud/vision'

const client = new ImageAnnotatorClient({
  keyFilename: 'path/to/service-account-key.json'
})

export async function POST(request: NextRequest) {
  const { imageUrl, prompt } = await request.json()
  
  const [result] = await client.textDetection(imageUrl)
  const detections = result.textAnnotations
  
  return NextResponse.json({
    success: true,
    analysis: `Text found: ${detections[0]?.description || 'No text detected'}`
  })
}
```

### 3. AWS Rekognition

**Pros**: Good for object detection, face analysis, content moderation  
**Cons**: Requires AWS setup, separate billing  

```typescript
// Install: npm install aws-sdk
import AWS from 'aws-sdk'

const rekognition = new AWS.Rekognition({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export async function POST(request: NextRequest) {
  const { imageUrl, prompt } = await request.json()
  
  const params = {
    Image: { S3Object: { Bucket: 'your-bucket', Name: 'image.jpg' } },
    MaxLabels: 10
  }
  
  const result = await rekognition.detectLabels(params).promise()
  
  return NextResponse.json({
    success: true,
    analysis: `Objects detected: ${result.Labels.map(l => l.Name).join(', ')}`
  })
}
```

### 4. Azure Computer Vision

**Pros**: Good for OCR, object detection, face detection  
**Cons**: Requires Azure setup, separate billing  

```typescript
// Install: npm install @azure/cognitiveservices-computervision
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { ApiKeyCredentials } from '@azure/ms-rest-js'

const client = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_VISION_KEY } }),
  process.env.AZURE_VISION_ENDPOINT
)

export async function POST(request: NextRequest) {
  const { imageUrl, prompt } = await request.json()
  
  const result = await client.describeImage(imageUrl)
  
  return NextResponse.json({
    success: true,
    analysis: `Description: ${result.captions[0]?.text || 'No description available'}`
  })
}
```

## Implementation Steps

### Step 1: Choose Your Vision API

1. **For General Purpose**: OpenAI GPT-4V
2. **For Text Extraction**: Google Cloud Vision
3. **For Object Detection**: AWS Rekognition
4. **For Enterprise**: Azure Computer Vision

### Step 2: Install Dependencies

```bash
# For OpenAI
npm install openai

# For Google Cloud Vision
npm install @google-cloud/vision

# For AWS Rekognition
npm install aws-sdk

# For Azure Computer Vision
npm install @azure/cognitiveservices-computervision @azure/ms-rest-js
```

### Step 3: Environment Variables

Add to your `.env` file:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# AWS Rekognition
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Azure Computer Vision
AZURE_VISION_KEY=your_azure_vision_key
AZURE_VISION_ENDPOINT=https://your-region.cognitiveservices.azure.com/
```

### Step 4: Update the Analysis API

Replace the current `app/api/analyze-image/route.ts` with your chosen vision API implementation.

### Step 5: Test the Integration

1. Go to `http://localhost:3000/test-image-analysis.html`
2. Upload an image
3. Click "Analyze Image"
4. Verify the analysis results

## Current Working Features

### ✅ Image Upload
- Files uploaded to `public/uploads/images/`
- Validation for file type and size
- Unique filename generation

### ✅ Database Integration
- Messages table supports `image_url` and `image_analysis`
- Proper data persistence and retrieval

### ✅ Chat Interface
- Image upload button in chat input
- Image preview before sending
- Image display in chat messages
- Image analysis results shown

### ✅ API Endpoints
- `POST /api/upload-image` - Handle image uploads
- `POST /api/analyze-image` - Analyze images (ready for vision API)
- `POST /api/chat` - Enhanced to handle images

## Testing

### Test Image Upload
```bash
curl -X POST http://localhost:3000/api/upload-image \
  -F "image=@test-image.jpg"
```

### Test Image Analysis
```bash
curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "http://localhost:3000/uploads/images/test.jpg", "prompt": "What do you see?"}'
```

### Test Chat with Image
1. Go to `http://localhost:3000/dashboard/chat?botId=5`
2. Upload an image
3. Send a message
4. Verify the bot responds with image analysis

## Next Steps

1. **Choose a Vision API** based on your needs and budget
2. **Set up API credentials** and environment variables
3. **Replace the basic analysis** with your chosen vision API
4. **Test thoroughly** with various image types
5. **Monitor usage and costs** of the vision API
6. **Consider caching** analysis results for repeated images

## Cost Considerations

- **OpenAI GPT-4V**: ~$0.01-0.03 per image
- **Google Cloud Vision**: ~$0.0015-0.005 per image
- **AWS Rekognition**: ~$0.001-0.01 per image
- **Azure Computer Vision**: ~$0.001-0.01 per image

Choose based on your expected volume and feature requirements.
