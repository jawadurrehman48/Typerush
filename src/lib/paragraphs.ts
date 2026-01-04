import { paragraphs as staticParagraphs } from './words';

export const getRandomParagraph = () => {
  return staticParagraphs[Math.floor(Math.random() * staticParagraphs.length)];
};
