const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function generateMCQs(text, numMCQs) {
  console.log('Generating MCQs with text:', text.substring(0, 100));
  const escapedText = text.replace(/"/g, '\\"');
  const command = `python ai-service/app.py --text "${escapedText}" --num_mcqs ${numMCQs}`;
  try {
    const { stdout } = await execPromise(command);
    console.log('MCQ generation output:', stdout);
    return JSON.parse(stdout).mcqs || [];
  } catch (error) {
    console.error('Error executing app.py for MCQs:', error);
    throw error;
  }
}

async function generateDescriptiveQuestions(pdfContent, numDescriptive) {
  console.log('Generating descriptive questions with PDF:', pdfContent.substring(0, 100));
  const escapedText = pdfContent.replace(/"/g, '\\"');
  const command = `python ai-service/app.py --pdf_content "${escapedText}" --num_descriptive ${numDescriptive}`;
  try {
    const { stdout } = await execPromise(command);
    console.log('Descriptive generation output:', stdout);
    return JSON.parse(stdout).descriptive || [];
  } catch (error) {
    console.error('Error executing app.py for descriptive:', error);
    throw error;
  }
}

module.exports = { generateMCQs, generateDescriptiveQuestions };