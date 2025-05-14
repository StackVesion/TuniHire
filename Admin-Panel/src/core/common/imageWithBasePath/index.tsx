import React from 'react';
import { img_path} from '../../../environment';

interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?:string;
}

const ImageWithBasePath = (props: Image) => {
  // Check if src is already a full URL (starts with http or https)
  const isFullUrl = props.src && (props.src.startsWith('http://') || props.src.startsWith('https://'));
  
  // Combine the base path and the provided src to create the full image source URL
  // only if it's not already a full URL
  const fullSrc = isFullUrl ? props.src : `${img_path}${props.src}`;
  
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

export default ImageWithBasePath;
