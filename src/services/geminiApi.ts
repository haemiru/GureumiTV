import { GoogleGenAI } from '@google/genai';
import type { ImageData, GeneratedVideo } from '../types';

// Gemini API service for video generation using Veo 3.1

// Load Gooreum-i reference image (small, cute white Pomeranian)
async function loadGooreumReferenceImage(): Promise<{ base64: string; mimeType: string } | null> {
    try {
        // Dynamically import the reference image (cute small white Pomeranian)
        const imageModule = await import('../assets/gooreum-reference.jpg');
        const imageUrl = imageModule.default;

        // Fetch the image and convert to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, mimeType: blob.type || 'image/jpeg' });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to load Gooreum-i reference image:', error);
        return null;
    }
}

// Generate scene image using Nanobanana Pro (Gemini 2.5 Flash Image)
export async function generateSceneImage(
    apiKey: string,
    location: string,
    time: string,
    situation: string,
    onProgress: (message: string) => void,
    aspectRatio: '16:9' | '9:16' | '1:1' = '9:16',
    situationRefImage?: { base64: string; mimeType: string } | null
): Promise<ImageData> {
    const ai = new GoogleGenAI({ apiKey });

    // Map aspect ratio to description
    const aspectRatioDesc = aspectRatio === '16:9' ? 'horizontal landscape (16:9)'
        : aspectRatio === '9:16' ? 'vertical portrait (9:16)'
            : 'square (1:1)';

    // Check if "구름이" is mentioned - if so, load reference image
    const hasGooreumiKeyword = situation.includes('구름이');
    let gooreumRef: { base64: string; mimeType: string } | null = null;

    if (hasGooreumiKeyword) {
        onProgress('구름이 참조 이미지를 불러오는 중...');
        gooreumRef = await loadGooreumReferenceImage();
    }

    // Build the prompt
    let promptText: string;

    if (hasGooreumiKeyword && gooreumRef) {
        promptText = `Look at the reference image carefully. This is "Gooreum-i" (구름이), a TINY, CUTE, SMALL white Pomeranian dog. Create a high-quality, cinematic photograph with ${aspectRatioDesc} aspect ratio based on these details:

Location: ${location}
Time: ${time}
Situation: ${situation}

=== CRITICAL CHARACTER REQUIREMENTS FOR "Gooreum-i" (구름이) ===
1. SIZE: Gooreum-i is a VERY SMALL dog - about 20-25cm tall, easily fits in one hand, MUCH SMALLER than a human (about 1/8 to 1/10 of adult human height)
2. BREED: Small white Pomeranian (NOT Samoyed, NOT Spitz, NOT any large breed)
3. APPEARANCE (MUST MATCH REFERENCE IMAGE FOR BASIC FEATURES): 
   - Pure fluffy WHITE fur (like cotton or cloud)
   - Tiny compact body with round face
   - Small black button eyes and tiny black nose
   - Adorable puppy-like features
   - Very fluffy and round overall shape
   ★★★ CLOTHING: Apply clothing as specified in the SITUATION description above ★★★
   - If the situation mentions specific clothing, dress Gooreum-i accordingly
   - The clothing should fit naturally on a small Pomeranian
4. SCALE REFERENCE: When with humans, Gooreum-i should be small enough to be held in arms or sit on a lap

=== REPORTER REQUIREMENT (MANDATORY) ===
★★★ The reporter MUST be a 20-year-old Korean female reporter ★★★
- Age: 20 years old (young, fresh-faced Korean woman)
- Appearance: Professional yet youthful Korean female reporter
- She MUST be holding a microphone with "Gureumi TV" text CLEARLY VISIBLE on it
- The microphone must have "Gureumi TV" written/printed on it
- The text "Gureumi TV" must be readable and clearly visible in the image
- The microphone should be a professional broadcast microphone
- Position the microphone so the "Gureumi TV" branding is facing the camera
- This is a branding requirement - DO NOT skip this!

=== OTHER REQUIREMENTS ===
- The dog must look EXACTLY like the reference image - a tiny, cute, fluffy white Pomeranian (apply clothing from situation description)

Style: Realistic, cinematic lighting, high resolution, detailed, Korean aesthetic, ${aspectRatio === '9:16' ? 'vertical' : aspectRatio === '16:9' ? 'horizontal' : 'square'} composition`;

        onProgress('구름이 참조 이미지를 적용하여 생성 중...');
    } else {
        promptText = `Create a high-quality, cinematic photograph scene with ${aspectRatioDesc} aspect ratio:
Location: ${location}
Time: ${time}
Situation: ${situation}

=== REPORTER REQUIREMENT (MANDATORY) ===
★★★ If there is a reporter in the scene, the reporter MUST be a 20-year-old Korean female ★★★
- Age: 20 years old (young, fresh-faced Korean woman)
- Appearance: Professional yet youthful Korean female reporter
- She MUST be holding a microphone with "Gureumi TV" text CLEARLY VISIBLE on it
- The microphone must have "Gureumi TV" written/printed on it
- The text "Gureumi TV" must be readable and clearly visible in the image
- The microphone should be a professional broadcast microphone
- Position the microphone so the "Gureumi TV" branding is facing the camera
- This is a branding requirement - DO NOT skip this!

Style: Realistic, cinematic lighting, high resolution, detailed, ${aspectRatio === '9:16' ? 'vertical' : aspectRatio === '16:9' ? 'horizontal' : 'square'} composition for short-form video`;
    }

    onProgress('Nanobanana Pro로 이미지 생성 요청 중...');

    try {
        // Build contents array - include reference image if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let contents: any;

        if (hasGooreumiKeyword && gooreumRef) {
            // Include reference image with the prompt
            contents = [
                {
                    inlineData: {
                        mimeType: gooreumRef.mimeType,
                        data: gooreumRef.base64,
                    },
                },
                // Add situation reference image if provided
                ...(situationRefImage ? [{
                    inlineData: {
                        mimeType: situationRefImage.mimeType,
                        data: situationRefImage.base64,
                    },
                }] : []),
                {
                    text: situationRefImage
                        ? `${promptText}\n\n=== ADDITIONAL REFERENCE IMAGE ===\nAlso refer to the second image as a style/situation reference. Match the overall mood, lighting, and atmosphere from this reference while creating the scene.`
                        : promptText
                },
            ];
        } else if (situationRefImage) {
            // Only situation reference image (no Gooreum-i)
            contents = [
                {
                    inlineData: {
                        mimeType: situationRefImage.mimeType,
                        data: situationRefImage.base64,
                    },
                },
                { text: `${promptText}\n\n=== REFERENCE IMAGE ===\nRefer to the provided image as a style/situation reference. Match the overall mood, lighting, composition, and atmosphere from this reference while creating the scene.` },
            ];
            onProgress('참고 이미지를 적용하여 생성 중...');
        } else {
            contents = promptText;
        }

        // Use Nanobanana Pro (gemini-2.5-flash-image) for image generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: contents,
            config: {
                responseModalities: ['Text', 'Image'],
                // Set aspect ratio using imageConfig
                imageConfig: {
                    aspectRatio: aspectRatio,
                },
            },
        });

        onProgress('이미지 처리 중...');

        // Find the image part in the response
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
            throw new Error('응답에서 이미지를 찾을 수 없습니다.');
        }

        let base64Data: string | null = null;
        let mimeType = 'image/png';

        for (const part of parts) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inlineData = (part as any).inlineData;
            if (inlineData) {
                base64Data = inlineData.data;
                mimeType = inlineData.mimeType || 'image/png';
                break;
            }
        }

        if (!base64Data) {
            throw new Error('이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.');
        }

        // Convert base64 to blob and create preview URL
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const preview = URL.createObjectURL(blob);

        // Create a File object from the blob
        const file = new File([blob], 'generated-image.png', { type: mimeType });

        // Get dimensions from the image
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.src = preview;
        });

        onProgress('이미지 생성 완료!');

        return {
            file,
            preview,
            width: dimensions.width,
            height: dimensions.height,
            base64: base64Data,
            mimeType: mimeType,
            aspectRatio: aspectRatio,
        };
    } catch (error) {
        console.error('Image generation error:', error);
        throw new Error(`이미지 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper function to download video with multiple fallback methods
async function downloadVideoFromResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoResponse: any,
    apiKey: string,
    onProgress: (message: string) => void
): Promise<Blob> {
    // Log available properties for debugging
    console.log('Video response object:', videoResponse);
    console.log('Video response keys:', Object.keys(videoResponse || {}));

    // Method 1: Check for inline video bytes (base64 encoded)
    if (videoResponse?.videoBytes) {
        onProgress('비디오 데이터 처리 중...');
        try {
            const binaryString = atob(videoResponse.videoBytes);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new Blob([bytes], { type: 'video/mp4' });
        } catch (e) {
            console.error('Failed to decode video bytes:', e);
        }
    }

    // Method 2: Check for video data in different property names
    const possibleDataProps = ['data', 'content', 'bytes', 'videoData', 'inlineData'];
    for (const prop of possibleDataProps) {
        if (videoResponse?.[prop]) {
            onProgress(`비디오 데이터 처리 중 (${prop})...`);
            try {
                const data = videoResponse[prop];
                if (typeof data === 'string') {
                    // Assume base64
                    const binaryString = atob(data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    return new Blob([bytes], { type: 'video/mp4' });
                } else if (data instanceof ArrayBuffer) {
                    return new Blob([data], { type: 'video/mp4' });
                } else if (data instanceof Uint8Array) {
                    return new Blob([data.slice()], { type: 'video/mp4' });
                } else if (typeof data === 'object' && data.data) {
                    // Handle nested data object
                    const binaryString = atob(data.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    return new Blob([bytes], { type: 'video/mp4' });
                }
            } catch (e) {
                console.error(`Failed to process ${prop}:`, e);
            }
        }
    }

    // Method 3: Try fetching from URI if available
    const uri = videoResponse?.uri || videoResponse?.url || videoResponse?.downloadUri;
    if (uri) {
        onProgress('비디오 다운로드 시도 중...');
        console.log('Attempting to fetch from URI:', uri);

        // Add API key to the URI for authentication
        const separator = uri.includes('?') ? '&' : '?';
        const authenticatedUri = `${uri}${separator}key=${apiKey}`;
        console.log('Fetching with authenticated URI');

        try {
            const response = await fetch(authenticatedUri, {
                method: 'GET',
                headers: {
                    'Accept': 'video/mp4,video/*,*/*',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 0) {
                    console.log('Successfully downloaded video, size:', blob.size);
                    return blob;
                }
            }
            console.log(`Fetch failed with status:`, response.status, response.statusText);
        } catch (e) {
            console.error(`Fetch error:`, e);
        }
    }

    // If we get here, we couldn't get the video
    const availableKeys = Object.keys(videoResponse || {}).join(', ');
    throw new Error(`비디오를 다운로드할 수 없습니다. 사용 가능한 속성: ${availableKeys || 'none'}`);
}

// Build enhanced video prompt with critical rules (for sequential generation - legacy)
function buildEnhancedVideoPrompt(
    userPrompt: string,
    sceneNumber: number,
    totalScenes: number,
    isLastScene: boolean
): string {
    // Extract dialogues from quotes in the prompt
    const hasDialogue = userPrompt.includes('"');
    const isFirstScene = sceneNumber === 1;

    // START with voice instruction - this is the most important thing
    let enhancedPrompt = '';

    // Voice instruction FIRST - before anything else
    if (isFirstScene) {
        enhancedPrompt = `★★★ 구름이 목소리: 한국 4세 여자 아기 목소리 ★★★
Voice for Gooreum-i: Use a VERY HIGH-PITCHED 4-year-old Korean baby girl voice.
- Pitch: EXTREMELY HIGH like a real toddler (NOT an adult pretending)
- Style: "조아조아~!", "헤헤~", "~해요~", baby lisp pronunciation
- This voice MUST continue EXACTLY the same in scenes 2, 3, 4!

[SCENE ${sceneNumber}/${totalScenes}]
${userPrompt}

=== VOICE RULES ===
1. GOOREUM-I VOICE (구름이 목소리):
   - 4세 한국 여자 아기처럼 엄청 높은 음으로 말해야 함
   - 발음: 혀 짧은 소리 (좋아→조아, 뭐해→머해)
   - 말투: "~해요", "~예요?", "히히", "에헤헤~"
   - 절대 성숙하거나 어른스럽게 들리면 안 됨
   
2. REPORTER VOICE (리포터 목소리):
   - 20살 한국 여성 리포터 (젊고 발랄한 목소리)
   - 20-year-old Korean female reporter
   - Professional yet youthful broadcasting voice
   - 마이크에 "Gureumi TV" 표시 필수!`;
    } else {
        // For scenes 2, 3, 4 - emphasize CONTINUATION
        enhancedPrompt = `⚠️⚠️⚠️ 중요: 구름이 목소리를 장면1과 똑같이 유지하세요! ⚠️⚠️⚠️
CRITICAL: Continue Gooreum-i's voice EXACTLY from Scene 1!
- SAME high pitch as Scene 1 (한국 4세 여자 아기)
- SAME baby-like speaking style
- DO NOT make the voice more mature or deeper!
- If voice changes at all = REJECTED

[SCENE ${sceneNumber}/${totalScenes}] - 이어서 (CONTINUATION)
${userPrompt}

=== 목소리 연속성 규칙 (VOICE CONTINUITY) ===
1. 구름이 목소리 = 장면1과 100% 동일해야 함
   - 장면1의 목소리를 그대로 이어가세요
   - 음높이: 장면1과 똑같이 높게 (4세 아기)
   - 말투: 장면1과 똑같이 (조아조아, 헤헤, ~해요)
   - 절대 목소리가 낮아지거나 성숙해지면 안 됨!
   
   Voice must be IDENTICAL to Scene 1:
   - Same HIGH pitch (4-year-old baby girl)
   - Same cute baby speech pattern
   - NEVER deeper, NEVER more mature
   
2. 리포터 목소리 = 장면1과 동일 (20살 한국 여성)
   - 20-year-old Korean female reporter voice`;
    }

    // Add posture rule
    enhancedPrompt += `

=== 자세 및 외모 규칙 (POSTURE & APPEARANCE) ===
- 구름이: 앉거나 누운 상태 유지 (일어서지 않기)
- Gooreum-i must stay SEATED or LYING DOWN
- ★ 구름이 외모: 작고 귀여운 하얀 포메라니안 (상황에서 지정한 옷 착용) ★
- Gooreum-i is a small cute white Pomeranian (apply clothing from scene description)`;

    // Add dialogue rules
    if (hasDialogue) {
        enhancedPrompt += `

=== 대사 규칙 (DIALOGUE) ===
- 마이크를 말하는 캐릭터 입 근처에 유지
- Microphone stays near speaking character's mouth`;
    }

    // Smiling rules
    if (!isLastScene) {
        enhancedPrompt += `

=== 표정 (EXPRESSION) ===
- 이 장면에서는 웃지 않기 (마지막 장면에서만 웃음)
- No smiling in this scene`;
    } else {
        enhancedPrompt += `

=== 마지막 장면 (FINAL SCENE) ===
- 대사 끝난 후에만 함께 미소
- Smile together only AFTER dialogue ends`;
    }

    // End with voice reminder
    enhancedPrompt += `

=== 최종 확인 ===
✓ 구름이 목소리 = 한국 4세 여자 아기 (장면1과 동일)
✓ Gooreum-i voice = 4-year-old Korean baby girl (same as Scene 1)`;

    return enhancedPrompt;
}

// Build unified video prompt for single video with multiple scenes
// This ensures voice consistency by generating everything in one video
function buildUnifiedVideoPrompt(
    prompts: string[],
    durationSeconds: number
): string {
    const sceneCount = prompts.length;
    const secondsPerScene = durationSeconds / sceneCount;

    // Build scene descriptions
    const sceneDescriptions = prompts.map((prompt, index) => {
        const startTime = index * secondsPerScene;
        const endTime = (index + 1) * secondsPerScene;
        const isLastScene = index === sceneCount - 1;

        let sceneText = `[장면 ${index + 1}] (${startTime}초 ~ ${endTime}초)
${prompt}`;

        if (!isLastScene) {
            sceneText += `
(이 장면에서는 웃지 않기)`;
        } else {
            sceneText += `
(대사가 끝난 후 함께 밝게 미소짓기)`;
        }

        return sceneText;
    }).join('\n\n');

    const unifiedPrompt = `★★★ 중요: ${durationSeconds}초 길이의 영상을 생성합니다 ★★★
이 영상은 ${sceneCount}개의 장면으로 구성됩니다. 각 장면은 약 ${secondsPerScene}초입니다.

=== 캐릭터 음성 설정 (전체 영상에서 일관되게 유지!) ===

1. 구름이 (GOOREUM-I) 목소리:
   ★ 한국 4세 여자 아기 목소리 - 영상 처음부터 끝까지 동일하게! ★
   - 음높이: 매우 높고 귀여운 아기 목소리 (성인이 흉내내는 것이 아닌 진짜 아기처럼)
   - 발음: 혀 짧은 발음 (좋아→조아, 뭐해→머해, 진짜→찐짜)
   - 말투: "~해요", "~예요?", "히히", "에헤헤~", "조아조아!"
   - 특징: 천진난만하고, 밝고, 애교 넘치는 톤
   
2. 리포터 목소리:
   ★ 20살 한국 여성 리포터 - "Gureumi TV" 마이크 필수! ★
   - 나이: 20살 (젊고 발랄한 한국 여성)
   - 외모: 전문적이면서도 젊고 밝은 느낌의 여성 리포터
   - 목소리: 친근하면서도 방송인다운 말투
   - 마이크에 "Gureumi TV" 브랜딩이 반드시 보여야 함

=== 중요 규칙 ===
- 마이크에 "Gureumi TV" 표시가 보여야 함
- 구름이는 앉거나 누운 자세 유지
- 대사할 때 마이크를 말하는 캐릭터 입 근처에 위치
- ★ 구름이 외모: 작고 귀여운 하얀 포메라니안 (장면 설명에서 지정한 옷 착용) ★

=== 장면 구성 (${durationSeconds}초 영상) ===

${sceneDescriptions}

=== 최종 확인사항 ===
✓ 총 영상 길이: ${durationSeconds}초
✓ 구름이 목소리: 영상 전체에서 동일한 4세 아기 목소리 유지
✓ 리포터 목소리: 영상 전체에서 동일한 목소리 유지
✓ 마지막 장면에서만 함께 미소`;

    return unifiedPrompt;
}

// Generate a single video with all scenes combined (for voice consistency)
export async function generateUnifiedVideo(
    apiKey: string,
    imageData: ImageData,
    prompts: string[],
    durationSeconds: number,
    onProgress: (message: string) => void,
    shouldStop?: () => boolean
): Promise<GeneratedVideo> {
    const ai = new GoogleGenAI({ apiKey });

    // Build unified prompt with all scenes
    const unifiedPrompt = buildUnifiedVideoPrompt(prompts, durationSeconds);

    onProgress('영상 생성 요청 중...');
    console.log('Unified prompt:', unifiedPrompt);

    try {
        // Generate single video with the unified prompt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let operation: any = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: unifiedPrompt,
            image: {
                imageBytes: imageData.base64,
                mimeType: imageData.mimeType,
            },
            config: {
                aspectRatio: imageData.aspectRatio,
                numberOfVideos: 1,
                durationSeconds: durationSeconds,
            },
        });

        // Poll until done
        let pollCount = 0;
        while (!operation.done) {
            // Check if we should stop during polling
            if (shouldStop?.()) {
                throw new Error('생성이 중지되었습니다.');
            }
            pollCount++;
            onProgress(`영상 처리 중... (${pollCount * 10}초 경과)`);
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation });
        }

        // Get the generated video
        const generatedVideoResponse = operation.response.generatedVideos[0];
        console.log('Generated video response:', generatedVideoResponse);

        onProgress('영상 다운로드 중...');

        // Download the video
        const videoBlob = await downloadVideoFromResponse(
            generatedVideoResponse.video,
            apiKey,
            onProgress
        );

        const videoUrl = URL.createObjectURL(videoBlob);

        const video: GeneratedVideo = {
            id: 'unified-video',
            videoUrl,
            videoBlob,
            prompt: unifiedPrompt,
            step: 1,
        };

        onProgress('영상 생성 완료!');
        return video;

    } catch (error) {
        console.error('Error generating unified video:', error);
        throw new Error(`영상 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
}


export async function generateVideosSequentially(
    apiKey: string,
    imageData: ImageData,
    prompts: string[],
    onProgress: (step: number, message: string) => void,
    onVideoGenerated: (video: GeneratedVideo) => void,
    shouldStop?: () => boolean
): Promise<GeneratedVideo[]> {
    const ai = new GoogleGenAI({ apiKey });
    const generatedVideos: GeneratedVideo[] = [];

    const totalVideos = prompts.length;

    for (let i = 0; i < totalVideos; i++) {
        // Check if we should stop before starting next video
        if (shouldStop?.()) {
            onProgress(i + 1, '생성이 중지되었습니다.');
            break;
        }

        const userPrompt = prompts[i];
        const isLastScene = i === totalVideos - 1;

        // Build enhanced prompt with critical rules
        const enhancedPrompt = buildEnhancedVideoPrompt(userPrompt, i + 1, totalVideos, isLastScene);

        onProgress(i + 1, `동영상 ${i + 1}/${totalVideos} 생성 요청 중...`);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let operation: any;

            // All videos start from the same original image (independent generation)
            // This allows users to edit videos separately in external software
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: enhancedPrompt,
                image: {
                    imageBytes: imageData.base64,
                    mimeType: imageData.mimeType,
                },
                config: {
                    aspectRatio: imageData.aspectRatio,
                    numberOfVideos: 1,
                },
            });

            // Poll until done
            let pollCount = 0;
            while (!operation.done) {
                // Check if we should stop during polling
                if (shouldStop?.()) {
                    onProgress(i + 1, '생성이 중지되었습니다.');
                    return generatedVideos;
                }
                pollCount++;
                onProgress(i + 1, `동영상 ${i + 1}/${totalVideos} 처리 중... (${pollCount * 10}초 경과)`);
                await new Promise((resolve) => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }

            // Get the generated video
            const generatedVideoResponse = operation.response.generatedVideos[0];
            console.log('Generated video response:', generatedVideoResponse);
            console.log('Video object:', generatedVideoResponse?.video);



            onProgress(i + 1, `동영상 ${i + 1}/${totalVideos} 다운로드 중...`);

            // Download the video using our helper function
            const videoBlob = await downloadVideoFromResponse(
                generatedVideoResponse.video,
                apiKey,
                (msg: string) => onProgress(i + 1, msg)
            );

            const videoUrl = URL.createObjectURL(videoBlob);

            const video: GeneratedVideo = {
                id: `video-${i + 1}`,
                videoUrl,
                videoBlob,
                prompt: userPrompt,
                step: i + 1,
            };

            generatedVideos.push(video);
            onVideoGenerated(video);
            onProgress(i + 1, `동영상 ${i + 1}/${totalVideos} 완료!`);

        } catch (error) {
            console.error(`Error generating video ${i + 1}:`, error);
            throw new Error(`동영상 ${i + 1} 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return generatedVideos;
}


// Helper function to detect aspect ratio from image dimensions
export function detectAspectRatio(width: number, height: number): '16:9' | '9:16' {
    const ratio = width / height;

    // If wider than tall, use 16:9, otherwise use 9:16
    if (ratio >= 1) {
        return '16:9';
    } else {
        return '9:16';
    }
}

// Helper function to convert file to base64
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix to get just the base64 data
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper function to get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Generate dialogue recommendations for the final video
export async function generateDialogueRecommendations(
    apiKey: string,
    prompts: string[],
    onProgress: (message: string) => void
): Promise<{ evaluationCriteria: string[]; recommendations: { dialogue: string; timingSeconds: number; reasoning: string }[] }> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    onProgress('대사 분석을 위한 기준을 수립 중...');

    // Build dynamic prompts list
    const promptsList = prompts.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const lastVideoNum = prompts.length;

    const prompt = `당신은 동영상 콘텐츠 전문가입니다. 아래는 ${prompts.length}개의 연속 동영상에 대한 프롬프트입니다.
마지막 동영상(동영상 ${lastVideoNum})의 내용을 분석하여 등장인물이 말할 수 있는 **익살스럽고 재미있는 대사**를 추천해주세요.

## 동영상 프롬프트들:
${promptsList}

## 중요 캐릭터 정보:
- **구름이**: 동영상에 등장하는 귀여운 하얀색 포메라니안 강아지입니다.
- **구름이의 목소리 특성**: 구름이는 **한국의 4세 여자 아기처럼 엄청 귀엽고 천진난만하게** 말합니다.
  
  === 목소리 & 말투 필수 규칙 ===
  1. **발음**: 혀 짧은 소리로 귀엽게 (예: "사랑해" → "싸랑해", "뭐해?" → "머해?", "진짜?" → "찐짜?")
  2. **문장 끝맺음**: 
     - "~해요", "~예요", "~거예요?", "~할래요!", "~좋아요!"
     - "~하는 거야?", "~인 거야?", "~해줘요~"
  3. **감탄사/추임새**: "와아~!", "우와~!", "헤헤", "히히", "으앙~", "에헤헤~", "음냠냠", "야호~!"
  4. **귀여운 표현들**:
     - "나 이거 조아조아!" (좋아좋아)
     - "너무너무 행복해요~"
     - "이게 뭐야? 이게 머냐고욧!"
     - "엄마아~ 아빠아~"
     - "간식 주세요요~ 응?"
     - "구름이 착하죠? 응응?"
     - "놀아줘요~ 심심해요~"
  5. **특징적 말버릇**:
     - 문장 끝에 "~요" 또는 "~용" 붙이기
     - 같은 말 반복 (예: "맛있다 맛있어!", "조아조아!")
     - 질문할 때 고개 갸웃하는 느낌 "~인 거야?"
  6. **톤**: 매우 밝고, 신나고, 애교 넘치고, 때로는 투정 부리듯이

  === 절대 하면 안 되는 것 ===
  - 어른스러운 말투 사용 금지
  - 너무 긴 문장 금지 (4세 아이는 짧게 말함)
  - 경어와 반말 섞어 쓰는 건 OK (아이들 특징)

## 요청사항:
1. **먼저**, 익살스럽고 재미 요소가 충분한 대사인지 평가하기 위한 **평가 기준 3~5개**를 수립해주세요.
2. **그 다음**, 위 기준을 모두 만족하는 대사 **2~3개**를 추천해주세요.
3. 구름이(포메라니안)가 말하는 경우, 반드시 위의 **4세 여자 아기 목소리 특성**을 100% 반영해주세요!
4. 각 대사에 대해:
   - 대사 내용 (누가 말하는지 명시)
   - 해당 대사가 들어가면 좋을 시점 (동영상 ${lastVideoNum}이 약 8초라고 가정, 0~8초 사이)
   - 왜 이 대사가 재미있는지 간단한 이유

## 출력 형식 (반드시 이 JSON 형식을 따라주세요):
\`\`\`json
{
  "evaluationCriteria": [
    "기준1: 설명",
    "기준2: 설명",
    "기준3: 설명"
  ],
  "recommendations": [
    {
      "dialogue": "추천 대사 1 (화자: 구름이/기자/등)",
      "timingSeconds": 2,
      "reasoning": "이 대사가 재미있는 이유"
    },
    {
      "dialogue": "추천 대사 2",
      "timingSeconds": 5,
      "reasoning": "이 대사가 재미있는 이유"
    }
  ]
}
\`\`\`

반드시 JSON 형식으로만 응답해주세요. 마크다운 코드 블록 안에 JSON을 넣어주세요.`;

    onProgress('Gemini API로 대사를 분석 중...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    onProgress('응답을 파싱 중...');

    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
        const parsed = JSON.parse(jsonStr);
        return {
            evaluationCriteria: parsed.evaluationCriteria || [],
            recommendations: parsed.recommendations || []
        };
    } catch {
        console.error('Failed to parse response:', text);
        throw new Error('대사 추천 응답을 파싱하는데 실패했습니다.');
    }
}

// Generate interview ideas for reporter and Gooreum-i (Pomeranian dog)
export async function generateInterviewIdeas(
    apiKey: string,
    onProgress: (message: string) => void
): Promise<{ location: string; time: string; situation: string; reporterDialogue: string; gooreumiDialogue: string }[]> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    onProgress('아이디어 생성 중...');

    const prompt = `당신은 유튜브 채널 "구름터"의 콘텐츠 기획자입니다. 
구름터 채널은 리포터가 귀여운 흰색 포메라니안 강아지 "구름이"를 인터뷰하는 형식의 숏폼 영상을 만듭니다.

## 영상 컨셉:
- 리포터가 마이크("Gureumi TV")를 들고 구름이에게 다양한 상황에서 인터뷰합니다
- 구름이는 4세 아기처럼 귀엽고 엉뚱하게 대답합니다
- 구름이의 마지막 대답은 항상 위트있고 재미있어야 합니다

## 구름이 말투 특성:
- 혀 짧은 소리 (예: "좋아" → "조아", "뭐해?" → "머해?")
- 귀여운 문장 끝맺음: "~해요", "~예요", "~할래요!", "~거예요?"
- 감탄사: "와아~!", "헤헤", "히히", "에헤헤~", "야호~!"
- 같은 말 반복: "맛있다맛있어!", "조아조아!"
- 짧고 귀여운 문장으로 말함

## 요청사항:
다양하고 창의적인 인터뷰 상황 5개를 제안해주세요. 
각 상황은 색다르고 재미있어야 하며, 마지막 구름이의 대답은 예상을 벗어나는 위트있는 답변이어야 합니다.

## 출력 형식 (반드시 JSON으로):
\`\`\`json
[
  {
    "location": "장소 (예: 놀이공원, 동물병원, 카페 등)",
    "time": "시간대 (예: 화창한 오후, 눈 오는 저녁 등)",
    "situation": "상황 설명 (20자 이내)",
    "reporterDialogue": "리포터의 질문 또는 대화 (예: '구름이, 오늘 기분이 어때요?')",
    "gooreumiDialogue": "구름이의 위트있고 재미있는 대답 (4세 아기 말투로)"
  }
]
\`\`\`

5개의 다양한 상황을 JSON 배열로 제안해주세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    onProgress('응답 파싱 중...');

    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.error('Failed to parse interview ideas response:', text);
        throw new Error('아이디어 생성 응답을 파싱하는데 실패했습니다.');
    }
}

