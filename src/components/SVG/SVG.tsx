import { icons } from './icons';

type IconName = keyof typeof icons;

const SVG = ({ name }: { name: IconName }) => {
  const Icon = icons[name];
  
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {Icon}
    </svg>
  );
};

export default SVG;