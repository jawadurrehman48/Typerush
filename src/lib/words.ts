export const paragraphs = [
  "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. It is often used for practicing touch typing.",
  "Technology has revolutionized the way we live and work. From smartphones to artificial intelligence, innovation continues to shape our future at an unprecedented pace.",
  "The sun dipped below the horizon, painting the sky in shades of orange and purple. A gentle breeze rustled the leaves, creating a soothing melody in the quiet evening.",
  "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take arms against a sea of troubles.",
  "Programming is the art of telling a computer what to do. It involves logic, creativity, and a lot of patience. Writing clean, efficient code is a skill that takes years to master.",
  "The vast expanse of the cosmos has always fascinated humanity. Stars, galaxies, and nebulae form a celestial tapestry that inspires wonder and curiosity about our place in the universe.",
  "A journey of a thousand miles begins with a single step. This ancient proverb reminds us that every great achievement starts with a small, manageable action.",
  "Music is a universal language that transcends cultural boundaries. It has the power to evoke emotions, tell stories, and bring people together from all walks of life."
];

// This function is no longer the primary source but can be a fallback or used for seeding.
export const getRandomParagraph = () => {
  return paragraphs[Math.floor(Math.random() * paragraphs.length)];
};
