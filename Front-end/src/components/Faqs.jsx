import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import Navbar from "./Navbar";

const faqs = [
  { question: "What is dyslexia?", answer: "Dyslexia is a specific learning disability that is neurobiological in origin. It is characterized by difficulties with accurate and/or fluent word recognition and by poor spelling and decoding abilities." },
  { question: "How can I support a child with dyslexia?", answer: "Support a child with dyslexia by providing them with a structured and supportive learning environment, using multisensory teaching methods, and being patient and understanding." },
  { question: "Can dyslexia be cured?", answer: "Dyslexia is a lifelong condition. However, with the right support and intervention, individuals with dyslexia can learn to read and write effectively." },
  { question: "What are the early signs of dyslexia in children?", answer: "Early signs of dyslexia in children may include difficulty learning the alphabet, trouble rhyming, difficulty recognizing words that begin with the same sound, and struggling with basic reading and writing tasks." },
  { question: "Are there any assistive technologies for dyslexia?", answer: "Yes, there are several assistive technologies for dyslexia, such as text-to-speech software, audiobooks, and dyslexia-friendly fonts to support reading and writing tasks." },
  { question: "What are some common myths about dyslexia?", answer: "Some common myths about dyslexia include that it is caused by laziness or lack of intelligence. In reality, dyslexia is not related to a person's intelligence but to the way their brain processes language." },
  { question: "How can I help my child with reading difficulties caused by dyslexia?", answer: "To help a child with reading difficulties caused by dyslexia, you can use structured literacy programs, engage in regular reading practice, and incorporate fun, interactive activities like games to reinforce learning." },
  { question: "How does dyslexia affect learning?", answer: "Dyslexia can make it challenging for individuals to decode written words, recognize letters and sounds, and spell correctly. However, with the right support, these challenges can be overcome." },
  { question: "Can dyslexia affect other skills besides reading?", answer: "Yes, dyslexia can affect writing, spelling, and sometimes math, but it does not affect a person's overall intelligence." },
  { question: "How can teachers support students with dyslexia?", answer: "Teachers can support students with dyslexia by using multisensory teaching methods, providing extra time, offering audio books, and using assistive technology." },
];

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Nunito, sans-serif', background: '#f8f9ff' }}>
      {/* Hero banner */}
      <div className="pt-24 pb-12 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
          style={{ background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.4)', color: '#FFD166' }}>
          <HelpCircle size={14} />
          Help Centre
        </div>
        <h1 className="font-fredoka text-4xl md:text-5xl text-white mb-3">Frequently Asked Questions</h1>
        <p className="text-white/60 text-lg">Everything you need to know about Emoti-Learn & dyslexia.</p>
      </div>

      {/* FAQ accordion — fully scrollable, no fixed height */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: 'white',
                boxShadow: openIndex === i ? '0 8px 30px rgba(132,94,247,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
                border: openIndex === i ? '2px solid #845EF7' : '2px solid transparent',
              }}
            >
              {/* Question row */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-bold text-gray-800 text-base hover:bg-gray-50 transition-colors"
              >
                <span>{faq.question}</span>
                {openIndex === i
                  ? <ChevronUp size={18} style={{ color: '#845EF7', flexShrink: 0 }} />
                  : <ChevronDown size={18} style={{ color: '#999', flexShrink: 0 }} />}
              </button>

              {/* Answer */}
              {openIndex === i && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed text-sm border-t border-gray-100 pt-3 animate-slide-up">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faqs;
