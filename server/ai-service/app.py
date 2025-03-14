import sys
import json
import argparse
import nltk
from nltk.tokenize import sent_tokenize
import spacy
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer, AutoModelForSeq2SeqLM, AutoTokenizer
import random

try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
except Exception as e:
    print(f"Error downloading NLTK resources: {e}")
    sys.exit(1)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class QuestionGenerator:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            print(f"Error loading spaCy: {e}. Run 'python -m spacy download en_core_web_sm'")
            sys.exit(1)
        self.qg_model = T5ForConditionalGeneration.from_pretrained("t5-base").to(device)
        self.qg_tokenizer = T5Tokenizer.from_pretrained("t5-base", model_max_length=512, legacy=True)
        self.answer_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base").to(device)
        self.answer_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base", model_max_length=512)

    def extract_sentences(self, text):
        sentences = sent_tokenize(text)
        filtered = [s for s in sentences if 10 < len(s) < 200]
        print(f"Extracted {len(filtered)} sentences from {len(sentences)}")
        return filtered

    def generate_mcq(self, sentence):
        input_text = f"Generate a clear MCQ based on: {sentence}"
        inputs = self.qg_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
        outputs = self.qg_model.generate(**inputs, max_length=100, num_beams=5)
        question = self.qg_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        input_text = f"Extract correct answer from: {sentence}"
        inputs = self.answer_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
        outputs = self.answer_model.generate(**inputs, max_length=50, num_beams=5)
        correct_answer = self.answer_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        distractors = set()
        for _ in range(10):
            input_text = f"Generate a distractor for: {question}, correct is {correct_answer}, based on: {sentence}"
            inputs = self.answer_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
            outputs = self.answer_model.generate(**inputs, max_length=50, num_beams=5)
            distractor = self.answer_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
            if distractor != correct_answer and distractor not in distractors:
                distractors.add(distractor)
            if len(distractors) >= 3: break
        distractors = list(distractors)[:3]
        while len(distractors) < 3:
            distractors.append(f"Option {len(distractors) + 1}")

        options = [correct_answer] + distractors
        random.shuffle(options)
        return {"question": question, "options": options, "correct": correct_answer}

    def generate_descriptive(self, pdf_content):
        sentences = [sent.text for sent in self.nlp(pdf_content).sents if len(sent.text) > 10]
        if not sentences: return None
        sentence = random.choice(sentences)
        input_text = f"Generate a detailed descriptive question based on: {sentence}"
        inputs = self.qg_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
        outputs = self.qg_model.generate(**inputs, max_length=100, num_beams=5)
        question = self.qg_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        input_text = f"Provide a detailed answer based on: {sentence}"
        inputs = self.answer_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
        outputs = self.answer_model.generate(**inputs, max_length=200, num_beams=5)
        answer = self.answer_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        return {"question": question, "answer": answer}

    def generate_mcqs(self, text, num_mcqs):
        sentences = self.extract_sentences(text)
        return [self.generate_mcq(s) for s in sentences[:num_mcqs] if s] if sentences else []

    def generate_descriptive_questions(self, pdf_content, num_descriptive):
        return [self.generate_descriptive(pdf_content) for _ in range(num_descriptive) if self.generate_descriptive(pdf_content)]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', type=str, default='')
    parser.add_argument('--pdf_content', type=str, default='')
    parser.add_argument('--num_mcqs', type=int, default=5)
    parser.add_argument('--num_descriptive', type=int, default=3)
    args = parser.parse_args()

    try:
        qg = QuestionGenerator()
        result = {"mcqs": qg.generate_mcqs(args.text, args.num_mcqs), "descriptive": qg.generate_descriptive_questions(args.pdf_content, args.num_descriptive)}
        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)