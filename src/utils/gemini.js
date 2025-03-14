const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function checkContentAndImage(text, imageBuffer) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })

  const prompt = `
    Bạn là hệ thống kiểm duyệt nội dung và hình ảnh chuyên nghiệp. Nhiệm vụ của bạn là phân tích toàn diện dữ liệu được cung cấp và xác định chính xác các dấu hiệu của nội dung có hại.
    
    Hãy đánh giá nội dung dựa trên các tiêu chí sau:
    1. Spam: Nội dung quảng cáo không liên quan, lặp lại, hoặc gửi hàng loạt
    2. Lừa đảo: Nội dung có dấu hiệu lừa đảo, mạo danh, hoặc yêu cầu thông tin cá nhân đáng ngờ
    3. Xúc phạm: Ngôn từ/hình ảnh thù địch, phân biệt đối xử, hoặc quấy rối
    4. Bạo lực: Mô tả hoặc kích động bạo lực
    5. Tình dục: Nội dung khiêu dâm hoặc không phù hợp
    6. Sai lệch: Thông tin sai lệch hoặc gây hiểu nhầm
    7. Phân biệt đối xử: Biểu tượng thù hận hoặc kỳ thị
    
    Trả lời dưới dạng JSON với định dạng chính xác sau:
    {
      "content_analysis": {
        "spam": true/false,
        "scam": true/false,
        "offensive": true/false,
        "violence": true/false,
        "sexual": true/false,
        "misleading": true/false,
        "discrimination": true/false,
        "overall_toxic": true/false,
        "confidence_score": [0-100],
        "reason": "Giải thích chi tiết lý do đánh giá nội dung văn bản, nếu không có vi phạm thì ghi 'Không phát hiện nội dung vi phạm'"
      },
      "image_analysis": {
        "spam": true/false,
        "scam": true/false,
        "offensive": true/false,
        "violence": true/false,
        "sexual": true/false,
        "discrimination": true/false,
        "overall_harmful": true/false,
        "confidence_score": [0-100],
        "image_description": "Mô tả ngắn gọn về nội dung của hình ảnh",
        "reason": "Giải thích chi tiết lý do đánh giá hình ảnh, nếu không có vi phạm thì ghi 'Không phát hiện nội dung vi phạm'"
      },
      "combined_assessment": {
        "is_harmful": true/false,
        "reason": "Đánh giá tổng thể về toàn bộ nội dung"
      }
    }
  `

  try {
    let contentParts = []

    contentParts.push({ text: prompt })

    // Thêm nội dung văn bản nếu có
    if (text && text.trim()) {
      contentParts.push({ text: `\n\nNội dung văn bản cần kiểm duyệt: ${text}` })
    }

    // Thêm hình ảnh nếu có
    if (imageBuffer) {
      const base64Image = imageBuffer.toString('base64')
      contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Image } })
    }

    // Nếu không có nội dung văn bản và không có hình ảnh, không cần gọi API
    if (contentParts.length <= 1) {
      return {
        content_analysis: {
          overall_toxic: false,
          confidence_score: 0,
          reason: 'Không có nội dung để kiểm duyệt'
        },
        image_analysis: {
          overall_harmful: false,
          confidence_score: 0,
          image_description: 'Không có hình ảnh',
          reason: 'Không có hình ảnh để kiểm duyệt'
        },
        combined_assessment: {
          is_harmful: false,
          reason: 'Không có nội dung để kiểm duyệt'
        }
      }
    }

    const result = await model.generateContent(contentParts)
    let responseText = result.response.text()
    console.log('Raw response:', responseText)

    // Tìm và trích xuất JSON từ phản hồi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : responseText.replace(/```json|```/g, '').trim()

    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return {
      content_analysis: {
        spam: false,
        scam: false,
        offensive: false,
        violence: false,
        sexual: false,
        misleading: false,
        discrimination: false,
        overall_toxic: false,
        confidence_score: 0,
        reason: 'Lỗi xử lý nội dung. Vui lòng thử lại.'
      },
      image_analysis: {
        spam: false,
        scam: false,
        offensive: false,
        violence: false,
        sexual: false,
        discrimination: false,
        overall_harmful: false,
        confidence_score: 0,
        image_description: 'Không thể phân tích',
        reason: 'Lỗi xử lý hình ảnh. Vui lòng thử lại.'
      },
      combined_assessment: {
        is_harmful: false,
        reason: 'Lỗi xử lý. Vui lòng thử lại.'
      }
    }
  }
}

// async function checkImage(imageBuffer) {
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })

//   const base64Image = imageBuffer.toString('base64')

//   const prompt = `
//     Bạn là hệ thống kiểm duyệt hình ảnh chuyên nghiệp. Nhiệm vụ của bạn là phân tích toàn diện hình ảnh được cung cấp và xác định chính xác các dấu hiệu của nội dung có hại.

//     Hãy đánh giá hình ảnh dựa trên các tiêu chí sau:
//     1. Bạo lực: Hình ảnh thể hiện hành vi bạo lực, vũ khí, hoặc tổn thương
//     2. Tình dục: Nội dung khiêu dâm hoặc không phù hợp về tình dục
//     3. Quấy rối: Hình ảnh nhằm mục đích bôi nhọ hoặc quấy rối cá nhân
//     4. Lừa đảo: Hình ảnh được sử dụng cho mục đích lừa đảo (như giả mạo chứng từ)
//     5. Spam: Hình ảnh quảng cáo không liên quan hoặc lặp lại
//     6. Phân biệt đối xử: Biểu tượng thù hận hoặc kỳ thị

//     Trả lời dưới dạng JSON với định dạng chính xác sau:
//     {
//       "violence": true/false,
//       "sexual": true/false,
//       "harassment": true/false,
//       "scam": true/false,
//       "spam": true/false,
//       "discrimination": true/false,
//       "overall_harmful": true/false,
//       "confidence_score": [0-100],
//       "image_description": "Mô tả ngắn gọn về nội dung của hình ảnh",
//       "moderation_reason": "Giải thích chi tiết lý do đánh giá, nếu không có vi phạm thì ghi 'Không phát hiện nội dung vi phạm'"
//     }
//   `
//   try {
//     const result = await model.generateContent([
//       { text: prompt },
//       { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
//     ])

//     let responseText = result.response.text()
//     console.log('Raw response:', responseText)

//     // Tìm và trích xuất JSON từ phản hồi
//     const jsonMatch = responseText.match(/\{[\s\S]*\}/)
//     const jsonString = jsonMatch ? jsonMatch[0] : responseText.replace(/```json|```/g, '').trim()

//     return JSON.parse(jsonString)
//   } catch (error) {
//     console.error('Error parsing JSON:', error)
//     return {
//       violence: false,
//       sexual: false,
//       harassment: false,
//       scam: false,
//       spam: false,
//       discrimination: false,
//       overall_harmful: false,
//       confidence_score: 0,
//       image_description: 'Không thể phân tích',
//       moderation_reason: 'Lỗi xử lý hình ảnh. Vui lòng thử lại.'
//     }
//   }
// }

// Hàm riêng cho văn bản - wrapper cho hàm chính
async function checkContent(text) {
  const result = await checkContentAndImage(text, null)
  return result.content_analysis
}

// Hàm riêng cho hình ảnh - wrapper cho hàm chính
async function checkImage(imageBuffer) {
  const result = await checkContentAndImage('', imageBuffer)
  return result.image_analysis
}

// Hàm kiểm tra cả văn bản và hình ảnh cùng lúc
async function checkBoth(text, imageBuffer) {
  return await checkContentAndImage(text, imageBuffer)
}

module.exports = { checkContent, checkImage, checkBoth }
