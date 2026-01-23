/**
 * Trivia Question Generator Script
 * 
 * This script generates trivia questions using AI and seeds them into the database.
 * It runs 100 iterations, each time selecting a random category and generating
 * a trivia question with 4 multiple choice answers.
 * 
 * Usage:
 *   npm run generate-trivia
 * 
 * Environment variables required:
 *   - OPENAI_API_KEY: Your OpenAI API key
 *   - DATABASE_URL: PostgreSQL database connection string
 */

import { PrismaClient } from '@prisma/client';
import { getRandomLeafCategory } from './triviaCategories';

const prisma = new PrismaClient();

interface TriviaQuestionData {
  question: string;
  choices: string[];
  correctAnswerIndex: number;
  citations: string[];
  questionContext?: string;
  answerContext?: string;
  tags: string[];
  importance: number;
  commonKnowledgeUserDateRange?: string;
}

/**
 * Generate a trivia question using OpenAI API
 */
async function generateTriviaQuestion(
  categoryPath: string,
  categoryItem: string
): Promise<TriviaQuestionData | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return null;
    }

    const prompt = `Generate a trivia question about "${categoryItem}" in the category "${categoryPath}".

Requirements:
1. Create a clear, interesting trivia question
2. Provide exactly 4 multiple choice answers
3. One answer must be correct
4. When possible, one incorrect answer should be close to the correct answer
5. Provide 1-2 credible sources/citations for the answer
6. Rate the importance (1-10) based on likelihood it would appear on a trivia show (1=unlikely, 10=very likely)
7. If found in actual game shows, importance should be above 8
8. Provide relevant tags/keywords
9. If applicable, provide age range most likely to know the answer (e.g., "1950-1980")
10. If helpful, provide additional context about the question or answer

Return a JSON object with this structure:
{
  "question": "string",
  "choices": ["choice1", "choice2", "choice3", "choice4"],
  "correctAnswerIndex": 0,
  "citations": ["source1", "source2"],
  "questionContext": "optional context about the question",
  "answerContext": "optional context about the answer",
  "tags": ["tag1", "tag2"],
  "importance": 5,
  "commonKnowledgeUserDateRange": "optional: YYYY-YYYY"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a trivia question expert. Generate high-quality trivia questions with accurate information and credible sources. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from the response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const triviaData = JSON.parse(jsonContent);
    
    // Validate the response
    if (!triviaData.question || !Array.isArray(triviaData.choices) || triviaData.choices.length !== 4) {
      console.error('Invalid response format from OpenAI');
      return null;
    }

    return triviaData;
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return null;
  }
}

/**
 * Save a trivia question to the database
 */
async function saveTriviaQuestion(
  categoryPath: string,
  triviaData: TriviaQuestionData
): Promise<boolean> {
  try {
    const correctAnswer = triviaData.choices[triviaData.correctAnswerIndex];
    const wrongAnswers = triviaData.choices.filter((_, index) => index !== triviaData.correctAnswerIndex);

    await prisma.triviaQuestion.create({
      data: {
        question: triviaData.question,
        correctAnswer: correctAnswer,
        wrongAnswer1: wrongAnswers[0] || '',
        wrongAnswer2: wrongAnswers[1] || '',
        wrongAnswer3: wrongAnswers[2] || '',
        category: categoryPath.split('/')[0], // Top-level category
        categoryPath: categoryPath,
        difficulty: 'medium', // Default difficulty
        citations: triviaData.citations || [],
        engagement: 0,
        choice1Count: 0,
        choice2Count: 0,
        choice3Count: 0,
        choice4Count: 0,
        upvotes: 0,
        downvotes: 0,
        questionContext: triviaData.questionContext || null,
        answerContext: triviaData.answerContext || null,
        tags: triviaData.tags || [],
        importance: triviaData.importance || 5,
        commonKnowledgeUserDateRange: triviaData.commonKnowledgeUserDateRange || null
      }
    });

    return true;
  } catch (error) {
    console.error('Error saving trivia question to database:', error);
    return false;
  }
}

/**
 * Main function to generate trivia questions
 */
async function generateTriviaQuestions(iterations: number = 100): Promise<void> {
  console.log(`Starting trivia question generation (${iterations} iterations)...`);
  
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < iterations; i++) {
    console.log(`\n[${i + 1}/${iterations}] Generating trivia question...`);

    // Get a random category
    const { path, item } = getRandomLeafCategory();
    console.log(`Category: ${path} -> ${item}`);

    // Generate the trivia question
    const triviaData = await generateTriviaQuestion(path, item);

    if (!triviaData) {
      console.log('Failed to generate question');
      failureCount++;
      continue;
    }

    console.log(`Question: ${triviaData.question}`);

    // Save to database
    const saved = await saveTriviaQuestion(path, triviaData);

    if (saved) {
      console.log('✓ Successfully saved to database');
      successCount++;
    } else {
      console.log('✗ Failed to save to database');
      failureCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Trivia generation complete!');
  console.log(`Successfully generated: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log('='.repeat(50));
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get number of iterations from command line or default to 100
    const iterations = parseInt(process.argv[2] || '100', 10);
    
    if (isNaN(iterations) || iterations < 1) {
      console.error('Invalid number of iterations. Using default: 100');
      await generateTriviaQuestions(100);
    } else {
      await generateTriviaQuestions(iterations);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script when executed directly
main();

export { generateTriviaQuestions, generateTriviaQuestion, saveTriviaQuestion };
